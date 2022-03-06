import {cleanCode, readFile} from './cleanCode2.js';
let PC=0
let INST = []
let REG = Array(32).fill(0x0)
let MEM = Array(0x1000).fill(0x0)

//test for memory access
MEM[0x100] = '0'
MEM[0x101] = '0'
MEM[0x102] = '0'
MEM[0X103] = 'f'

REG[0] = 0X1
REG[1] = 0X1
REG[2] = 0x100
REG[3]=0x2

let map_insts = []
map_insts['add'] = '000'
map_insts['sub'] = '001'
map_insts['lw'] = '010'
map_insts['sw'] = '011'
map_insts['jal']='100'
map_insts['bne']='101'
map_insts['addi']='110'

let rType = [
    'add',
    'sub',
]

let sType = [
    'lw',
    'sw'
]
let jType=['jal']
let bType = ['bne']
let iType=['addi']

INST=cleanCode(readFile('code.txt')); //storing instructions from unlceancode.txt

//MEMORY & CONCERSION MODULES 
function _32bti(raw_data){ //hex to integer
    return parseInt((raw_data.join('')), 16)
}

function _32itb(raw_data){
    let _32i = raw_data.toString(2) //to binary
    let diff = _32i.length - 32

    if (diff < 0){ // adjust _32i to exactly have 32 bits
        _32i = ("0".repeat(Math.abs(diff)) + _32i)
    }else if(diff > 0){
        _32i = (_32i.substring(diff))
    }

    let bytes = Array(4)
    for (let i = 0; i < 4;i++){
        bytes[i] = parseInt(_32i.substring(8*i, 8*i + 8), 2).toString(16) //32 bit split into 4x8 bits and stored as hex
    }

    return bytes
}

function memFetch(addr){ // returns 4 continuous memory blocks from addr
    return MEM.slice(addr, addr+4)
}

function mem_wb(addr ,raw_data){ // write back
    MEM[addr] = raw_data[0]
    MEM[addr+1] = raw_data[1]
    MEM[addr+2] = raw_data[2]
    MEM[addr+3] = raw_data[3]
}

/**
 * Instruction Fetch
 * Instruction Decode/File Read
 * Execution
 * Memory Access
 * Write Back
 */

function instFetch(PC){
    return INST[PC];
}

function instDecode(inst){
    let words = []
    
    for (const x of inst.split(' ')){ 
        if (x !== ''&&x!=',') words.push(x.trim()) // added &&x!=',' because splitting the instruction from cleancode also returns ',' so array is containing 5 elemts instead of 3
    }
    let keyword = words[0].toLowerCase()
    let targets = []

    if (rType.includes(keyword)){
        for (const x of words.slice(1)){
            targets.push(parseInt(x.replace('x','').replace(',',''))) //removal of x and , from strings
        }
        PC++;
    }

    if (sType.includes(keyword)){
        let rd = parseInt(words[1].replace('x','').replace(',',''))
        let mix = words[2].replace('x','').replace(',','')
        let offset = parseInt(mix)
        let rs = parseInt(mix.substring(mix.indexOf('(')+1))
        targets.push(rd, offset, rs)
        PC++;
    }
    if(jType.includes(keyword)){ 
        let rd = parseInt(words[1].replace('x','').replace(',',''))
        let index= parseInt(words[2].replace('$','').replace(',',''))
        targets.push(rd,index)
    }
    if(bType.includes(keyword)){
        let reg1=parseInt(words[1].replace('x','').replace(',',''))
        let reg2=parseInt(words[2].replace('x','').replace(',',''))
        let index= parseInt(words[3].replace('$','').replace(',',''))
        targets.push(reg1,reg2,index)

    }
    if(iType.includes(keyword)) {
        
    }
    return [keyword].concat(targets)
}

function execute(instDecoded){
    let keyword = instDecoded[0].toLowerCase()
    let targets = instDecoded.slice(1)
    let opcode = map_insts[keyword]

    switch(opcode){
        case '000':
            //add functionality
            REG[targets[0]] = REG[targets[1]] + REG[targets[2]]
            console.log('FUNC:', keyword, 'TARGETS:', targets)
            console.log(REG)
        break;

        case '001':
            //sub functionality
            REG[targets[0]] = REG[targets[1]] - REG[targets[2]]
            console.log('FUNC:', keyword, 'TARGETS:', targets)
            console.log(REG)
        break;

        case '010':
            //load word functionality
            REG[targets[0]] = _32bti(memFetch(REG[targets[2]] + targets[1])) //d from memory is fetched after conversion from hex to integer after joining 4 x split hex d
            console.log('FUNC:', keyword, 'TARGETS:', targets)
            console.log(REG)
        break;

        case '011':
            //store word functionality
            mem_wb(REG[targets[2]] + targets[1], _32itb(REG[targets[0]])) // storing 32 bit d in 4 contiguous memory blocks
            console.log('FUNC:', keyword, 'TARGETS:', targets)
            console.log(REG)
            console.log(MEM)
        break;
        case '100':
            REG[targets[0]]=PC+1
            PC=targets[1]
            console.log('FUNC:', keyword, 'TARGETS:', targets)
            console.log(REG)
            console.log(MEM)
        break;
        case '101':
            if(REG[1]!=REG[0])PC=targets[2]
            else PC++
        break;
        default:
            console.out('opcode not found')
    }
}

//main function 

function main(){ 
    console.log(INST)
    while (PC<INST.length){
        let inst = instFetch(PC)
        let decoded_inst = instDecode(inst)
        execute(decoded_inst)
    }
}

main()
