import { cleanCode, readFile } from "./cleanCode.js";
import { MEMORY } from "./memory.js";
import { map_types, map_insts, rType, sType, iType, jType, bType, pseudoType, directives } from "./instSet.js";

class RISCV {
    constructor() {
        this.MEM = new MEMORY()
        this.INST = cleanCode(readFile('BubbleSort.s'), this.MEM);
    }

    instFetch() {
        return this.INST[this.MEM.PC]
    }

    instDecode(inst) {
        let words = []
        for (const x of inst.split(' ')) {
            if (x !== '' && x !== ',')
                words.push(x.trim())
        }

        let keyword = words[0].toLowerCase()
        let targets = []

        if (rType.includes(keyword)) {
            for (const x of words.slice(1))
                targets.push(parseInt(x.replace(/x|,/g, '')))
        }

        if (sType.includes(keyword)) {
            let rd, rs, mix, offset
            rd = parseInt(words[1].replace(/x|,/g, ''))

            mix = words[2].replace(/x|,/g, '')
            offset = parseInt(mix)
            rs = this.MEM.REG_READ(parseInt(mix.substring(mix.indexOf('(') + 1)))

            targets.push(rd, offset, rs)
        }

        if (jType.includes(keyword)) {
            //let rd = parseInt(words[1].replace('x', '').replace(',', ''))
            let index = parseInt(words[1].replace(',', ''))
            targets.push(index)
        }

        if (bType.includes(keyword)) {
            let reg1 = parseInt(words[1].replace('x', '').replace(',', ''))
            let reg2 = parseInt(words[2].replace('x', '').replace(',', ''))
            let index = parseInt(words[3].replace(',', ''))
            targets.push(reg1, reg2, index)
        }

        if (iType.includes(keyword)) {
            let rd = parseInt(words[1].replace('x', '').replace(',', ''))
            let rs = parseInt(words[2].replace('x', '').replace(',', ''))
            let num = parseInt(words[3].replace(',', ''))
            targets.push(rd, rs, num)
        }

        if (pseudoType.includes(keyword)) {
            let rd = parseInt(words[1].replace('x', '').replace(',', ''))
            let num = parseInt(words[2].replace(',', ''))

            targets.push(rd, num)
        }

        return [keyword].concat(targets)
    }

    execute(instDecoded) {
        let keyword = instDecoded[0].toLowerCase()
        let targets = instDecoded.slice(1)
        let opcode = map_insts[keyword]

        switch (opcode) {
            //Requirements ADD/SUB, BNE, JAL, LW/LW

            //ADD
            case '00000':
                //add x1, x2, x3
                this.MEM.REG_WRITE(targets[0], (this.MEM.REG_READ(targets[1]) + this.MEM.REG_READ(targets[2])));
                this.MEM.PC++;
                break;

            //SUB
            case '00001':
                //sub x1, x2, x3
                this.MEM.REG_WRITE(targets[0], (this.MEM.REG_READ(targets[1]) - this.MEM.REG_READ(targets[2])));
                this.MEM.PC++;
                break;

            //LOAD WORD
            case '00010':
                //lw x1, 4(x2)
                this.MEM.REG_WRITE(targets[0], this.MEM.MEM_READ(targets[2] + targets[1]));
                this.MEM.PC++;
                break;

            //STORE WORD
            case '00011':
                //sw x1, 4(x2)
                this.MEM.MEM_WRITE(targets[2] + targets[1], this.MEM.REG_READ(targets[0]));
                this.MEM.PC++;
                break;

            //JUMP AND LINK
            case '00100':
                //jal x1, offset
                this.MEM.REG_WRITE(1, this.MEM.PC + 1);
                this.MEM.PC_WRITE(targets[0] + this.MEM.PC);
                break;

            //BRANCH NOT EQUAL TO
            case '00101':
                //bne x0, x2, offset
                if (this.MEM.REG_READ(targets[0]) != this.MEM.REG_READ(targets[1])) {
                    this.MEM.PC_WRITE(targets[2] + this.MEM.PC);
                } else {
                    this.MEM.PC++;
                }
                break;

            //ADD IMMEDIATE
            case '00110':
                //addi rd,rs,constant
                this.MEM.REG_WRITE(targets[0], this.MEM.REG_READ(targets[1]) + targets[2])
                this.MEM.PC++;
                break;

            //LOAD IMMEDIATE
            case '00111':
                this.MEM.REG_WRITE(targets[0], targets[1])
                this.MEM.PC++
                break;

            //LOAD ADDRESS
            case '01000':
                this.MEM.REG_WRITE(targets[0], targets[1])
                this.MEM.PC++;
                break;

            //AND
            case '01001':

                break;

            //OR
            case '01010':

                break;

            //BLT
            case '01011':
                //blt x0, x2, offset
                if (this.MEM.REG_READ(targets[0]) < this.MEM.REG_READ(targets[1])) {
                    this.MEM.PC_WRITE(targets[2] + this.MEM.PC);
                } else {
                    this.MEM.PC++;
                }
                break;

            //BEQ    
            case '01100':
                //beq x0, x2, offset
                if (this.MEM.REG_READ(targets[0]) == this.MEM.REG_READ(targets[1])) {
                    this.MEM.PC_WRITE(targets[2] + this.MEM.PC);
                } else {
                    this.MEM.PC++;
                }
                break;

            //BGE
            case '01101':
                //bge x0, x2, offset
                if (this.MEM.REG_READ(targets[0]) >= this.MEM.REG_READ(targets[1])) {
                    this.MEM.PC_WRITE(targets[2] + this.MEM.PC);
                } else {
                    this.MEM.PC++;
                }
                break;

            default:
                console.log('opcode not found')
                console.log('FLAG')
                this.PC++;
        }

        //console.log('FUNC:', keyword, 'TARGETS:', targets)
        //this.MEM.REG_DISPLAY(true)
        //this.MEM.MEM_DISPLAY(true, 10)
    }

    start() {
        while (this.MEM.PC < this.INST.length) {
            let inst = this.instFetch(this.MEM.PC)
            let decoded_inst = this.instDecode(inst)
            this.execute(decoded_inst)
        }

        console.log('Final State::')
        this.MEM.REG_DISPLAY(true)
        //this.MEM.MEM_DISPLAY(true, 256) // for entire memory view
        this.MEM.MEM_DISPLAY(true, 10) // for 10 rows only 
    }
}

function main() {
    let riscv = new RISCV()
    riscv.start()
}

main()