let map_types = []
map_types['rtype'] = '0000001'
map_types['stype'] = '0000010'
map_types['jtype'] = '0000011'
map_types['btype'] = '0000100'
map_types['itype'] = '0000101'


let map_insts = []
map_insts['add']  = '00000'
map_insts['sub']  = '00001'
map_insts['lw']   = '00010'
map_insts['sw']   = '00011'
map_insts['jal']  = '00100'
map_insts['bne']  = '00101'
map_insts['addi'] = '00110'
map_insts['li']   = '00111'
map_insts['la']   = '01000'
map_insts['and']  = '01001'
map_insts['or']   = '01010'
map_insts['blt']  = '01011'
map_insts['beq']  = '01100'
map_insts['bge']  = '01101'

let rType = ["add", "sub", "xor", "or", "and", "sll", "srl", "sra", "slt", "sltu"];
let iType = ["addi", "xori", "ori", "andi", "slli", "srli", "srai", "slti", "sltiu", "lb", "lh", "lw", "lbu", "lhu"];
let sType = ["sb", "sh", "sw"];
let bType = ["beq", "bne", "blt", "bge", "bltu", "bgeu"]
let jType = ["jal"]
let pseudoType = ["li", "la"];

let directives = ['.data', '.text', '.asciz', '.string', '.globl', '.word']

export { map_types, map_insts, rType, sType, iType, jType, bType, pseudoType, directives };