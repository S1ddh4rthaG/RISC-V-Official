//COLORS
let Reverse = "\x1b[7m"
let Reset = "\x1b[0m"

const _32bit = 0xFFFFFFFF

let reg_map = {
    0: 'zero',
    1: 'ra',
    2: 'sp',
    3: 'gp',
    4: 'tp',
    5: 't0',
    6: 't1',
    7: 't2',
    8: 's0',
    9: 's1',
    10: 'a0',
    11: 'a1',
    12: 'a2',
    13: 'a3',
    14: 'a4',
    15: 'a5',
    16: 'a6',
    17: 'a7',
    18: 's2',
    19: 's3',
    20: 's4',
    21: 's5',
    22: 's6',
    23: 's7',
    24: 's8',
    25: 's9',
    26: 's10',
    27: 's11',
    28: 't3',
    29: 't4',
    30: 't5',
    31: 't6'
}

class MEMORY {
    constructor() {
        this.PC = 0;
        this.REG = Array(0x20).fill(0x0);
        this.MEM = Array(0x1000).fill(0x0);
    }

    PC_READ() {
        return this.PC;
    }

    PC_WRITE(val) {
        this.PC = val & _32bit;
    }

    REG_READ(id) {
        console.assert(id >= 0 && id <= 31, 'REG_READ access out of bounds.')
        return (id >= 0 && id <= 31)
            ? this.REG[id]
            : 0
    }

    REG_WRITE(id, val) {
        console.assert(id >= 0 && id <= 31, 'REG_WRITE access out of bounds.')
        if (id >= 1 && id <= 31)
            this.REG[id] = val & _32bit;
    }

    MEM_READ(addr) {
        console.assert(addr % 4 === 0, 'MEM_READ address not aligned');
        console.assert(addr < 0x1000, 'MEM_READ address out of bounds')

        if (addr % 4 == 0 && addr < 0x1000) {
            let mem_word = this.MEM.slice(addr, addr + 4)
            const val = mem_word.reduce(
                (previousValue, currentValue) =>
                    (previousValue << 8) + currentValue
            );
            return val;
        }
    }

    MEM_WRITE(addr, val) {
        val = val & _32bit;
        console.assert(addr % 4 === 0, 'MEM_WROTE address not aligned')
        console.assert(addr < 0x1000, 'MEM_READ address out of bounds')

        if (addr % 4 == 0 && addr < 0x1000) {
            for (let i = 3; i >= 0; i--) {
                this.MEM[addr + i] = val & 0xFF;
                val = val >> 8;

            }
        }
    }

    MEM_DISPLAY(hex = true, rSize = 10) {
        if (hex === true) {
            let hexMEM = this.MEM.slice(0, (4 * 4) * rSize).reduce((acc, val, idx) =>
                idx % 4 === 0
                    ? (acc ? `${acc} 0x${this.toHEX(val)}` : `0x${this.toHEX(val)}`)
                    : `${acc}${this.toHEX(val)}`, ''
            ).split(' ')

            let hexTable = []
            let j = 0, idx = 0;

            for (let i = 0; i < rSize; i++) {
                //hexTable[this.toHEX(idx, 3)] = hexMEM.slice(j, j+4)
                hexTable[this.toHEX(idx, 4).toString()] = {
                    '3 - 0': hexMEM[j],
                    '7 - 4': hexMEM[j + 1],
                    '11 - 8': hexMEM[j + 2],
                    '15 - 12': hexMEM[j + 3]
                }
                j += 4;
                idx += 16;
            }
            console.log(Reverse, `MEMORY: `, Reset)
            console.table(hexTable)
        }
    }

    REG_DISPLAY(hex = true) {
        if (hex == true) {
            let hexTable = []
            for (let i = 0; i < 16; i++) {
                //linear: hexTable['x' + i + '(' + reg_map[i] + ')'] = '0x0' + this.toHEX(this.REG[i], 8)
                let row = {
                    'REG(0-15)': 'x' + i + ' [' + reg_map[i] + ']',
                    'VAL(0-15)': '0x0' + this.toHEX(this.REG[i], 8),
                    'REG(16-31)': 'x' + (i + 16) + ' [' + reg_map[i + 16] + ']',
                    'VAL(16-31)': '0x0' + this.toHEX(this.REG[i + 16], 8)
                }

                hexTable[i] = row
            }
            console.log(Reverse, 'REGISTERS:', Reset)
            console.table(hexTable)
        }
    }

    //Utility Functions
    toHEX(val, size = 2) {
        console.assert(size < 32, 'toHEX crossed system limit.')

        if (size < 32) {
            let valStr = (val >>> 0).toString(16)
            let len = valStr.length

            if (len <= size) {
                valStr = '0'.repeat(size - len) + valStr;
            } else {
                valStr = valStr.substring(len - size, len)
            }
            return valStr
        }
        return '0'.repeat(32)
    }
}

function mem_test() {
    let mem = new MEMORY()

    mem.MEM[0] = 0xFF
    mem.MEM[1] = 0xFF
    mem.MEM[2] = 0xFF
    mem.MEM[3] = 0xFF
    mem.MEM_WRITE(0x4, -2)

    mem.MEM_DISPLAY(true, 10)
    mem.REG_DISPLAY(true)
}

export { MEMORY };