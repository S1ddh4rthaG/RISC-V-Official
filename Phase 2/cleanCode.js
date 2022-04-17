import fs from 'fs';
import { FgBlack, BgWhite, Reset, FgRed } from "./colors.js"
import { rType, sType, iType, jType, bType, pseudoType } from "./instSet.js";

const labelEx = /[a-zA-Z0-9]+( )*[a-zA-Z0-9]+( )*:/g

function pureCode(file_address, mem_module){
    let instructions = cleanCode(readFile(file_address), mem_module); 
    let pureCode = []

    for (const i in instructions){
        let tokens = []
        for (const x of instructions[i].split(' ')){
            if (x !== '' && x !== ',') tokens.push(x.trim())
        }

        let keyword = tokens[0];

        let parsedInst = []
        
        if (rType.includes(keyword)){
            //inst rd, rs1, rs2

            let rd  = parseInt(tokens[1].replace(/x|,/g, ''));
            let rs1 = parseInt(tokens[2].replace(/x|,/g, ''));
            let rs2 = parseInt(tokens[3].replace(/x|,/g, ''));

            parsedInst = [keyword, rd, rs1, rs2, 'r'];
        }

        if (sType.includes(keyword)){
            //inst rd, offset(rs)

            let imm_rs = tokens[2].replace(/x|,/g, '');

            let rd  = parseInt(tokens[1].replace(/x|,/g, ''));
            let imm = parseInt(imm_rs);
            let rs  = parseInt(imm_rs.substring(imm_rs.indexOf('(') + 1));

            parsedInst = [keyword, rd, rs, imm, 's'];
        }

        if (iType.includes(keyword)){
            if (keyword[0] === 'l'){
                //Case 1: inst rd, imm(rs)

                let imm_rs = tokens[2].replace(/x|,/g, '');

                let rd  = parseInt(tokens[1].replace(/x|,/g, ''));
                let imm = parseInt(imm_rs);
                let rs  = parseInt(imm_rs.substring(imm_rs.indexOf('(') + 1));
    
                parsedInst = [keyword, rd, rs, imm, 'i'];
            }else{
                //Case 2: insti rd, rs, imm

                let rd  = parseInt(tokens[1].replace(/x|,/g, ''));
                let rs  = parseInt(tokens[2].replace(/x|,/g, ''));
                let imm = parseInt(tokens[3]);

                parsedInst = [keyword, rd, rs, imm, 'i'];
            }
        }

        if (bType.includes(keyword)){
            //inst rs1, rs2, offset
            let rs1    = parseInt(tokens[1].replace('x', '').replace(',', ''))
            let rs2    = parseInt(tokens[2].replace('x', '').replace(',', ''))
            let offset = parseInt(tokens[3].replace(',', ''))

            parsedInst = [keyword, rs1, rs2, offset, 'b'];
        }

        if (jType.includes(keyword)){
            //inst offset
            let offset = parseInt(tokens[1].replace(',', ''));

            parsedInst = [keyword, offset, 'j'];
        }

        if (pseudoType.includes(keyword)){
            //inst rd offset
            let rd     = parseInt(tokens[1].replace('x', '').replace(',', ''))
            let offset = parseInt(tokens[2].replace(',', ''))
            
            parsedInst = [keyword, rd, offset, 'pT'];
        }

        pureCode.push(parsedInst)
    }
    return pureCode;
}

function readFile(file_address) {
    try {
        const file_read = fs.readFileSync(file_address, 'utf8')
        return file_read.toString()
    } catch (err) {
        console.log('File:', 'clearCode.js')
        console.log('Func:', 'readFile()')
        console.log('Description:\n', err)
    }
}

function cleanCode(file_read, MEM) {
    let lines = file_read.toString().split('\n')
    let data;

    for (var j in lines) {
        lines[j] = lines[j].replace(/(\s\s+)/g, ' ')
        lines[j] = lines[j].trim()
        lines[j] = lines[j].replace(/#.*/g, '')
        lines[j] = lines[j].replace(/( )*:/g, ':')
        lines[j] = lines[j].replaceAll(' ,', ",")
    }

    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    if (lines.includes('.data') && lines.includes('.text')) {
        data  = lines.slice(lines.indexOf('.data') + 1, lines.indexOf('.text'))
        lines = lines.slice(lines.indexOf('.text') + 1)
    } else if (lines.includes('.data')) {
        console.log(FgRed, 'Text Segment Missing', Reset)
    } else if (lines.includes('.text')) {
        lines = lines.slice(1)
    }

    let Labels = new Set()  
    for (let j = 0; j < lines.length; j++) {
        if (lines[j].charAt(lines[j].length - 1) == ':') {
            if (j < lines.length - 1) {
                if (lines[j + 1].includes(':')) lines[j] = ""
                else {
                    lines[j + 1] = lines[j] + " " + lines[j + 1]
                    lines[j] = ""
                }
            }
        }
    }

    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    for (const i in lines) {
        lines[i] = lines[i].trim()

        if (labelEx.test(lines[i])) {
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0, -1))

            for (const x of curr_labels) {
                if (Labels.has(x)) 
                    lines[i] = lines[i].replace(new RegExp(x + ":", 'g'), '')
                else 
                    Labels.add(x)
            }
            lines[i] = lines[i].replaceAll(',', ", ")
        }

        lines[i] = lines[i].replaceAll(',', ", ")
        lines[i] = lines[i].replace(/(\s\s+)/g, ' ')
        lines[i] = lines[i].trim()
    }

    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })

    for (const i in lines) {
        let gen_label = i

        if (labelEx.test(lines[i])) {
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0, -1))

            for (const elmt of curr_labels) {
                if (Labels.has(elmt)) {
                    lines[i] = lines[i].replaceAll(elmt + ':', '').trim()
                    lines = lines.map((line, idx) => line.replace(elmt, gen_label))
                }
            }
        }
    }

    lines = processSegment(data, MEM, lines)

    lines = lines.filter((line) => { return !line.match(/(^ *$)/g) })
    // console.log(FgBlack, BgWhite, 'Instructions', Reset)
    // console.log(lines, '\nNumber of Instructions: ', lines.length, '\n')
    return lines
}

function processSegment(data, MEM, lines) {
    let map_var = []
    for (const i in data) {
        let label = data[i].substring(0, data[i].indexOf(':')).trim() 
        data[i] = data[i].substring(data[i].indexOf(':') + 1).trim()

        let type = data[i].substring(data[i].indexOf(':') + 1, data[i].indexOf(' ')) 
        data[i] = data[i].substring(data[i].indexOf(' ') + 1).trim()

        map_var[label] = MEM.REG_READ(2); 

        for (const x in lines) {
            if (lines[x].substring(lines[x].lastIndexOf(' ') + 1) === label) {
                lines[x] = lines[x].replaceAll(label, MEM.REG_READ(2)) 
            }
        }

        if (type === '.word') {
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

function tobin(num, size) {
    let b = (num >>> 0).toString(2);
    if (num < 0) b = b.substring(32 - size)
    else {
        while (b.length < size) b = '0' + b;
    }
    return b
}

export { pureCode };