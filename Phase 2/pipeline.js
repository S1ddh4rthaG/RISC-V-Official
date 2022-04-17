import { pureCode } from "./cleanCode.js";
import { MEMORY } from "./memory.js";
import { Reverse, Reset } from "./colors.js";

class Pipeline {
    constructor() {
        this.PC = 0;
        this.MEM = new MEMORY();
        this.INST = pureCode('BubbleSort.s', this.MEM);

        //COUNTERS
        this.cycles = 0; // # of cycles
        this.stalls = 0; // # of stalls
        this.kills  = 0; // # of kills
        this.wb_c   = 0; // # of WB completed

        //BUFFERS
        this.IF_ID; // Buffer btw IF and ID
        this.ID_EX; // Buffer btw ID and EX
        this.EX_MM; // Buffer btw EX and MM
        this.MM_WB; // Buffer btw MM and WB

        //To keep track of what parts of pipeline were active 
        this.pipeline_status = [];
        this.pipelineTable = [];
        this.stallList = [];
    }

    resetPipeline(){
        //reset the info about pipeline
        this.pipeline_status["IF"] = '';
        this.pipeline_status["ID"] = '';
        this.pipeline_status["EX"] = '';
        this.pipeline_status["MM"] = '';
        this.pipeline_status["WB"] = '';
    }

    instructionFetch() {
        if (this.MEM.PC < this.INST.length){
            let fetchedInst = this.INST[this.PC];

            //if nullInst is fetched
            if (fetchedInst == undefined){
                this.IF_ID = undefined;
                return;
            }

            this.IF_ID    = fetchedInst;
            this.IF_ID.no = this.PC;

            // Continue IF as usual if PC == MEM.PC
            if (this.PC == this.MEM.PC){ 
                this.MEM.PC++;
                this.pipeline_status["IF"] = "IF" + this.IF_ID.no;
            }else{ 
                if (this.IF_ID != undefined){
                    this.kills++;//killed IF
                }   
                this.IF_ID = undefined;
            }
            return;
        }

        this.IF_ID = undefined;
    }

    instructionDecode() {
        //Empty buffer
        if (this.IF_ID == undefined){
            this.ID_EX = undefined;
            return;
        }

        let decodedInst = this.IF_ID;
        let type = decodedInst[decodedInst.length - 1];

        let rs1_val, rs2_val, rs_val, readRegInst;

        //Instruction Decoded as per type
        if (type == 'r') { //if the instruction is of type R { [keyword, rd, rs1.val, rs2.val, 'r'] }
            rs1_val = this.MEM.REG_READ(decodedInst[2]);
            rs2_val = this.MEM.REG_READ(decodedInst[3]);

            readRegInst = [decodedInst[0], decodedInst[1], rs1_val, rs2_val, 'r'];
        }else if (type == 'i') { //if the instruction is of type I { [keyword, rd, rs.val, imm, 'i'] }
            rs_val = this.MEM.REG_READ(decodedInst[2]);

            readRegInst = [decodedInst[0], decodedInst[1], rs_val, decodedInst[3], 'i']
        } else if (type == 's') { //if the instruction is of type S { [keyword, rd(source), rs.val, imm, 'i'] }
            rs1_val = this.MEM.REG_READ(decodedInst[1]);
            rs2_val = this.MEM.REG_READ(decodedInst[2]);

            readRegInst = [decodedInst[0], rs1_val, rs2_val, decodedInst[3], 's']
        }else if (type == 'b') { //if the instruction is of type B { [keyword, rs1.val, rs2.val, offset, 'b'] }
            rs1_val = this.MEM.REG_READ(decodedInst[1]);
            rs2_val = this.MEM.REG_READ(decodedInst[2]);

            readRegInst = [decodedInst[0], rs1_val, rs2_val, decodedInst[3], 'b']
        } else if (type == 'j') { //if the instruction is of type J { [keyword, offset, 'j'] }
            this.MEM.PC_WRITE(decodedInst[1]);
            readRegInst = decodedInst
        } else if (type == 'pT') { //if the instruction is of type PT { [keyword, rd, offset, 'pT'] }
            readRegInst = decodedInst
        }

        //load it into ID_EX Latch
        this.ID_EX    = readRegInst;
        this.ID_EX.no = this.IF_ID.no;
        this.pipeline_status["ID"] = "ID" + this.ID_EX.no;

        this.IF_ID = undefined; //unload the IF_ID
    }

    execute() {
        //Empty Buffer
        if (this.ID_EX == undefined){
            this.EX_MM = undefined;
            return;
        }

        let ALULatch = this.ID_EX;
        let ALU = ALULatch;

        let type    = ALU[ALU.length - 1];
        let keyword = ALU[0];

        let rd, rs_val, rs1_val, rs2_val, res, imm, offset;

        switch (type) {
            case 'r':
                // OUTPUT: [keyword, rd, rs1.val (op) rs2.val, 'r']

                rd      = ALU[1];
                rs1_val = ALU[2];
                rs2_val = ALU[3];
                res;

                switch (keyword) {
                    case "add":
                        res = rs1_val + rs2_val;
                        break;

                    case "sub":
                        res = rs1_val - rs2_val;
                        break;
                }

                ALU = [keyword, rd, res, 'r'];
            break;

            case 's':
                // OUTPUT: [keyword, rd.val, rs.val (op) imm, 'i']

                rd     = ALU[1]
                rs_val = ALU[2];
                imm    = ALU[3];

                switch (keyword) {
                    case "sw":
                        res = rs_val + imm;
                        break;
                }

                ALU = [keyword, rd, res, 's'];
            break;

            case 'i':
                // OUTPUT: [keyword, rd, rs.val (op) imm, 'i'];

                rd     = ALU[1]
                rs_val = ALU[2]
                imm    = ALU[3]

                switch (keyword) {
                    case "addi":
                        res = rs_val + imm;
                    break;

                    case "lw":
                        res = rs_val + imm;
                        break;
                }

                ALU = [keyword, rd, res, 'i'];
            break;

            //Note: We would know branch output by the end of the EX operation
            case 'b':
                // OUTPUT: [keyword, updated_PC(aka. res), taken, 'b']
                
                rs1_val = ALU[1];
                rs2_val = ALU[2];
                offset  = ALU[3];

                let taken = false;

                switch (keyword) {
                    case "beq":
                        if (rs1_val == rs2_val) {
                            taken = true;
                            res = (offset);
                        } else {
                            res = (this.MEM.PC);
                        }
                    break;

                    case "bne":
                        if (rs1_val != rs2_val) {
                            taken = true;
                            res = (offset);
                        } else {
                            res = (this.MEM.PC);
                        }
                    break;

                    case "blt":
                        if (rs1_val < rs2_val) {
                            taken = true;
                            res = (offset);
                        } else {
                            res = (this.MEM.PC);
                        }
                    break;

                    case "bge":
                        if (rs1_val >= rs2_val) {
                            taken = true;
                            res = (offset);
                        } else {
                            res = (this.MEM.PC);
                        }
                    break;
                }

                //For branch we update the PC as well
                this.MEM.PC_WRITE(res);
                ALU = [keyword, res, taken, 'b'];
            break;

            case 'j':
                // OUTPUT: [keyword, offset, 'j']
                offset = ALU[1];
            break;

            case 'pT':
                // OUTPUT: [keyword, rd, offset, 'pT']

                rd     = ALU[1];
                offset = ALU[2];
            break;

            default:
                console.log("Unknowm Instruction Type - Execution Stage");
            break;
        }

        //load the result to EX_MM latch
        this.EX_MM    = ALU;
        this.EX_MM.no = this.ID_EX.no;
        this.pipeline_status["EX"] = "EX" + this.EX_MM.no;

        // If branch is taken in EX taken clear IF and ID buffers
        if (type == 'b' && ALU[2]){
            if (this.IF_ID != undefined) this.kills++; // killed future ID 
            this.IF_ID = undefined;
            this.ID_EX = undefined;
            return true;
        }
        this.ID_EX = undefined;
    }

    memory() {
        //Empty buffer
        if (this.EX_MM == undefined){
            this.MM_WB = undefined;
            return;
        }
        let memInst = this.EX_MM;
        let type    = memInst[memInst.length - 1];
        let keyword = memInst[0];

        let res;

        switch (keyword) {
            case "lw":
            // INPUT: [keyword, rd, rs.val (op) imm, 'i'];
                res = this.MEM.MEM_READ(memInst[2]);
                memInst[2] = res;
            break;

            case "sw":
            // INPUT: [keyword, rd.val, rs.val (op) imm, 'i'];
                this.MEM.MEM_WRITE(memInst[2], memInst[1]);
            break;
        }
        // load into MM_WB buffer
        this.MM_WB    = memInst;
        this.MM_WB.no = this.EX_MM.no;
        this.pipeline_status["MM"] = "MM"+this.MM_WB.no;
        
        this.EX_MM = undefined;
    }

    writeBack() {
        if (this.MM_WB == undefined) return;
        this.pipeline_status["WB"] = "WB"+this.MM_WB.no;
        this.wb_c++; //register this as completed

        let wbInst = this.MM_WB;
        let type   = wbInst[wbInst.length - 1];

        switch (type) {
            case 'r':
            case 'i':
            case 'pT':
                // INPUT: [keyword, rd, res, ....]
                this.MEM.REG_WRITE(wbInst[1], wbInst[2]);
            break;
        }

        this.MM_WB = undefined;
    }

    isFilled(latch){
        return (latch != undefined);
    }

    checkReadRegs(reg, inst){
        //if dependency is on reg 0 OR latch unfilled
        if (reg == 0 || !this.isFilled(inst)) return false;

        let type = inst[inst.length - 1];

        switch(type){
            case 'r':
                if (reg == inst[2] || reg == inst[3]){
                    return true;
                }
            break;

            case 'i':
                if (reg == inst[2]){
                    return true;
                }
            break;

            case 's':
                if (reg == inst[1] || reg == inst[2]){
                    return true;
                }
            break;

            case 'b':
                if (reg == inst[1] || reg == inst[2]){
                    return true;
                }
            break;
        }
    }

    areLatchedCleared(){
        return (this.isFilled(this.IF_ID) || this.isFilled(this.ID_EX) || this.isFilled(this.EX_MM) || this.isFilled(this.MM_WB))
    }

    shouldStall(){
        let shouldStall = false;

        //-- Can Data Forward
        // if MM_WB is available, then check for destination match
        if (this.isFilled(this.MM_WB)){
            let type = this.MM_WB[this.MM_WB.length - 1]

            if (type == 'r' || type == 'i' || type == 'pT'){
                // if rd is same then wait and stall
                if (this.checkReadRegs(this.MM_WB[1], this.IF_ID)){
                    shouldStall = true;
                }
            }
        }

        //-- Can Data Forward
        // if EX_MM is available, then check for destination match 
        if (this.isFilled(this.EX_MM)){
            let type = this.EX_MM[this.EX_MM.length - 1]

            if (type == 'r' || type == 'i' || type == 'pT'){
                // if rd is same then wait and stall
                if (this.checkReadRegs(this.EX_MM[1], this.IF_ID)){
                    shouldStall = true;
                }
            }
        }

        // if ID_EX is available, then check for destination match
        if (this.isFilled(this.ID_EX)){
            let type = this.ID_EX[this.ID_EX.length - 1]

            if (type == 'r' || type == 'i' || type == 'pT'){
                // if rd is same then should compulsorily stall
                if (this.checkReadRegs(this.ID_EX[1], this.IF_ID)){
                    shouldStall = true;
                }
            }
        }

        return shouldStall;
    }

    IPC(){
        //NULL instructions
        if (this.cycles == 0){
            return 0;
        }else{
            return (this.INST.length/this.cycles);
        }
    }

    DisplayInfo(){
        console.log(Reverse, "Instructions:", Reset, "\n");
        console.log(this.INST);

        console.log(Reverse, "Pipelined Without Data Forwarding Enabled:", Reset);
        console.table(this.pipelineTable);
        
        console.log(Reverse,"CYCLES:", Reset, this.cycles, " ",Reverse, "STALLS:", Reset ,this.stalls, " ", Reverse, "KILLS:", Reset ,this.kills, Reverse, "IPC:", Reset, this.IPC(), "\n");
        console.log(Reverse, "NOTE:", Reset, "(*) - stalled instruction", "\n\t[*] - killed instruction\n")
        
        this.MEM.REG_DISPLAY(true);
        this.MEM.MEM_DISPLAY(true, 10);

        console.log(Reverse, "STALLED LIST:", Reset);
        console.log(this.stallList);
    }

    start() {   
        while (this.PC < this.INST.length || this.areLatchedCleared()) {
            this.resetPipeline(); // reset the pipeline 

            let shouldStall = this.shouldStall();
            let takenBranch = false;

            this.cycles++;
            this.PC = this.MEM.PC;

            this.writeBack(); 
            this.memory();
            let branchTaken = this.execute(); 
            if (branchTaken == true){
                this.pipeline_status["IF"] = "*[IF]";
                this.pipeline_status["ID"] = "*[ID]";
                takenBranch = true;
            }

            if (!takenBranch){
                if (shouldStall){
                    this.pipeline_status["IF"] = "*(IF)";
                    this.pipeline_status["ID"] = "*(ID)";
                    this.stallList.push(this.INST[this.IF_ID.no]);
                    this.stalls++;
                }else{
                    this.instructionDecode();
                    this.instructionFetch();
                }
            }

            this.pipelineTable[this.cycles]={
                "IF":this.pipeline_status["IF"],
                "ID":this.pipeline_status["ID"],
                "EX":this.pipeline_status["EX"],
                "MM":this.pipeline_status["MM"],
                "WB":this.pipeline_status["WB"]
            }
        }
        this.DisplayInfo();
    }
}

function main() {
    let riscv = new Pipeline();
    riscv.start();
}

main();