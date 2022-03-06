import fs from 'fs';
import { map_types, map_insts, rType, sType, iType, jType, bType, pseudoType, directives } from "./instSet.js";
import { FgBlack, BgWhite, Reset, FgRed } from "./colors.js"
const labelEx = /[a-zA-Z0-9]+( )*[a-zA-Z0-9]+( )*:/g

/** 
 * Reads the file from given address
*/
function readFile(file_address) {
    try {
        const file_read = fs.readFileSync(file_address, 'utf8')
        return file_read.toString()
    } catch (err) {
        //Error Description
        console.log('File:', 'clearCode.js')
        console.log('Func:', 'readFile()')
        console.log('Description:\n', err)
    }
}

/**
 * Converts the code into chunks of risc V code
 */
function cleanCode(file_read, MEM) {
    let lines = file_read.toString().split('\n')
    let data

    for (var j in lines) {
        //Remove extra spaces from code
        lines[j] = lines[j].replace(/(\s\s+)/g, ' ')
        lines[j] = lines[j].trim()

        //Remove Comments from code
        lines[j] = lines[j].replace(/#.*/g, '')
        lines[j] = lines[j].replace(/( )*:/g, ':')
        lines[j] = lines[j].replaceAll(' ,', ",")
    }

    //Remove empty lines
    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    //To separate instructions from data segment
    if (lines.includes('.data') && lines.includes('.text')) {
        data = lines.slice(lines.indexOf('.data') + 1, lines.indexOf('.text'))
        lines = lines.slice(lines.indexOf('.text') + 1)
    } else if (lines.includes('.data')) {
        //If only .data is present
        console.log(FgRed, 'Text Segment Missing', Reset)
    } else if (lines.includes('.text')) {
        //If only .text is present
        lines = lines.slice(1)
    }

    let Labels = new Set()  // Set of all labels
    for (let j = 0; j < lines.length; j++) {
        //Convert newline labels to inline labels
        if (lines[j].charAt(lines[j].length - 1) == ':') {
            if (j < lines.length - 1) {
                if (lines[j + 1].includes(':'))
                    lines[j] = ""
                else {
                    lines[j + 1] = lines[j] + " " + lines[j + 1]
                    lines[j] = ""
                }
            }
        }
    }

    //Remove any empty lines generated in this process
    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    //Remove Junk
    for (const i in lines) {
        //Trim out left and right spaces
        lines[i] = lines[i].trim()

        //Identify and parse labels
        if (labelEx.test(lines[i])) {
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0, -1))

            // Maintain set of all labels seen && remove duplicates
            for (const x of curr_labels) {
                if (Labels.has(x)) lines[i] = lines[i].replace(new RegExp(x + ":", 'g'), '')
                else Labels.add(x)
            }
            lines[i] = lines[i].replaceAll(',', ", ")
        }

        //Remove extra spaces(middle, left and right) & other space characters
        lines[i] = lines[i].replaceAll(',', ", ")
        lines[i] = lines[i].replace(/(\s\s+)/g, ' ')
        lines[i] = lines[i].trim()
    }
    //Remove empty lines generated in this process
    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    //Generate Pseudo Code{For Label Access}
    for (const i in lines) {
        let gen_label = i

        //Replace every label with generated label
        if (labelEx.test(lines[i])) {
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0, -1))

            for (const elmt of curr_labels) {
                if (Labels.has(elmt)) {
                    lines[i] = lines[i].replaceAll(elmt + ':', '').trim()
                    lines = lines.map((line, idx) => line.replace(elmt, gen_label - idx))
                }
            }
        }
    }

    lines = processSegment(data, MEM, lines)

    //Remove empty lines generated in this process(for end of line case)
    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })
    console.log(FgBlack, BgWhite, 'Instructions', Reset)
    //console.log(binaryInst(lines))
    console.log(lines, '\nNumber of Instructions: ', lines.length, '\n')
    return lines
}

//To process data segment(i.e we have to load memory with values before execution even begins)
function processSegment(data, MEM, lines) {
    let map_var = []
    for (const i in data) {
        let label = data[i].substring(0, data[i].indexOf(':')).trim() //Storing Variable Name
        data[i] = data[i].substring(data[i].indexOf(':') + 1).trim()

        let type = data[i].substring(data[i].indexOf(':') + 1, data[i].indexOf(' ')) //Storing Data Type
        data[i] = data[i].substring(data[i].indexOf(' ') + 1).trim()

        map_var[label] = MEM.REG_READ(2); //stack pointer pts to address

        // TODO: What if .text and .data have same label?
        for (const x in lines) {
            if (lines[x].substring(lines[x].lastIndexOf(' ') + 1) === label) {
                lines[x] = lines[x].replaceAll(label, MEM.REG_READ(2)) //
            }
        }

        if (type === '.word') {

            //splitting the elements of the array 
            data[i] = data[i].replaceAll(',', ' ').split(' ')
            data[i] = data[i].filter((line) => { return !line.match(/(^ *$)/g) })

            for (const x in data[i]) {
                MEM.MEM_WRITE(MEM.REG_READ(2), parseInt(data[i][x]))
                MEM.REG_WRITE(2, MEM.REG_READ(2) + 0x4)

            }

        }
        else if (type === '.asciz') {
            //incomplete 
            MEM.REG_WRITE(2, MEM.REG_READ(2) + data[i].length)
        }
        else if (type === '.space') {
            console.assert(parseInt(data[i]) % 4 === 0, 'Space allocated should be multiple of 4')
            if (parseInt(data[i]) % 4 === 0)
                MEM.REG_WRITE(2, MEM.REG_READ(2) + parseInt(data[i]))
        }
    }
    return lines
}

//function that coverts integer to signed binary of a particular size
function tobin(num, size) {
    let b = (num >>> 0).toString(2);
    if (num < 0) b = b.substring(32 - size)
    else {
        while (b.length < size) b = '0' + b;
    }
    return b
}

//function that converts instructions to 32 bit binary instructions
function binaryInst(inst) {
    let binInst = []
    for (var i in inst) {
        let words = []
        for (const x of inst[i].split(' ')) {
            if (x !== '' && x !== ',')
                words.push(x.trim())
        }

        let keyword = words[0].toLowerCase()
        let targets = []
        let bin = ''
        let fun7 = '0000000'

        if (rType.includes(keyword)) {
            bin += '0000001' //opcode
            for (const x of words.slice(1))
                targets.push(parseInt(x.replace(/x|,/g, '')))

            bin = tobin(targets[0], 5) + bin //rd

            if (keyword == 'add' || keyword == 'sub') {
                bin = '000' + bin //function3
            }
            else bin = '---' + bin // to check errors

            bin = tobin(targets[2], 5) + tobin(targets[1], 5) + bin
            if (keyword == 'sub') fun7 = '0100000'
            bin = fun7 + bin;
        }

        else if (sType.includes(keyword)) {
            //load and store have different opcodes
            let rd = parseInt(words[1].replace(/x|,/g, ''))
            let mix = words[2].replace(/x|,/g, '')
            let offset = parseInt(mix)
            let rs = parseInt(mix.substring(mix.indexOf('(') + 1))

            if (keyword == 'sw') {
                bin += '000' + tobin(offset, 12).substring(7) + '0100010'
                bin = tobin(offset, 12).substring(0, 7) + tobin(rs, 5) + tobin(rd, 5) + bin
            }
            else {
                bin += tobin(rd, 5) + '0000010'
                bin = '000' + bin
                bin = tobin(offset, 12) + tobin(rs, 5) + bin
            }

        }
        else if (jType.includes(keyword)) {

            let rd = parseInt(words[1].replace('x', '').replace(',', ''))
            let index = parseInt(words[2].replace(',', ''))

            bin += tobin(index, 20) + tobin(rd, 5) + '0000011'
        }

        else if (bType.includes(keyword)) {

            let reg1 = parseInt(words[1].replace('x', '').replace(',', ''))
            let reg2 = parseInt(words[2].replace('x', '').replace(',', ''))
            let index = parseInt(words[3].replace(',', ''))

            bin = '000' + tobin(index, 12).substring(7) + '0000100'
            bin = tobin(index, 12).substring(0, 7) + tobin(reg2, 5) + tobin(reg1, 5) + bin

        }

        else if (iType.includes(keyword)) {

            let rd = parseInt(words[1].replace('x', '').replace(',', ''))
            let rs = parseInt(words[2].replace('x', '').replace(',', ''))
            let num = parseInt(words[3].replace(',', ''))
            targets.push(rd, rs, num)

            bin += tobin(rd, 5) + '0000101' //rd+opcode
            bin = '000' + bin //function3 
            bin = tobin(num, 12) + tobin(rs, 5) + bin
        }

        else if (pseudoType.includes(keyword)) {

            if (words[0] === 'li') {
                let rd = parseInt(words[1].replace('x', '').replace(',', ''))
                let num = parseInt(words[2].replace(',', ''))
                keyword = 'addi'

                bin += tobin(rd, 5) + '0000101' //rd+opcode
                bin = '000' + bin //function3 
                bin = tobin(num, 12) + '00000' + bin //rs=x0 in addi
            }

            else { console.log('pseudo instruction not defined') }
        }

        else bin = 'could not convert to binary instruction'

        binInst.push(bin)
    }
    return binInst
}

function main() {
    //console.log(cleanCode(readFile('code.txt')))
}
main()

export { cleanCode, readFile };