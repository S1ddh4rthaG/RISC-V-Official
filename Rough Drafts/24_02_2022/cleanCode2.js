import fs from 'fs';

//Clean Code RegEx
//////////////////
const regEx = /( |,)x[0-9]+/g
const labelEx = /[a-zA-Z0-9]+( )*[a-zA-Z0-9]+( )*:/g
const offsetEx = /\([0-9]+\)/g
//////////////////

/** 
 * Reads the file from given address
*/
function readFile(file_address){
    try{
        const file_read = fs.readFileSync(file_address, 'utf8')
        return file_read.toString()
    }catch(err){
        //Error Description
        console.log('File:', 'clearCode.js')
        console.log('Func:', 'readFile()')
        console.log('Description:\n', err)
    }
}

/**
 * Converts the code into chunks of risc V code
 */
function cleanCode(file_read){
    let lines = file_read.toString().split('\n')
    
    for(var j in lines){
        //Remove extra spaces from code
        lines[j] = lines[j].replace(/(\s\s+)/g, ' ')
        lines[j] = lines[j].trim()

        //Remove Comments from code
        lines[j] = lines[j].replace(/#.*/g,'')
        lines[j] = lines[j].replace(/( )*:/g, ':')

    }
    //Remove empty lines
    lines = lines.filter((line) => {return !line.match(/(^ *$)/g)})

    let Labels = new Set()  // Set of all labels
    for(var j=0; j < lines.length; j++){
        //Convert newline labels to inline labels
        if(lines[j].charAt(lines[j].length-1)==':'){
            if(j < lines.length-1){
                if(lines[j+1].includes(':'))
                    lines[j]=""
                else{ 
                    lines[j+1]=lines[j]+" "+lines[j+1]   
                    lines[j]=""
                }
            }
        }
    }
    
    //Remove any empty lines generated in this process
    lines = lines.filter((line) => {return !line.match(/(^ *$)/g)})

    //Remove Junk
    for (const i in lines){
        //Trim out left and right spaces
        lines[i] = lines[i].trim()
        
        //Identify and parse labels
        if (labelEx.test(lines[i])){
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0,-1))

            // Maintain set of all labels seen && remove duplicates
            for (const x of curr_labels){
                if (Labels.has(x)) lines[i] = lines[i].replace(new RegExp(x + ":", 'g'), '')
                else Labels.add(x)
            }
            lines[i]=lines[i].replaceAll(',',", ")
        }

        //Remove extra spaces(middle, left and right) & other space characters
        lines[i] = lines[i].replace(/(\s\s+)/g, ' ')
        lines[i] = lines[i].trim()
    }
    //Remove empty lines generated in this process
    lines = lines.filter((line) => {return !line.match(/(^ *$)/g)})

    //Generate Pseudo Code{For Label Access}
    for (const i in lines){
        let gen_label = '$' + i + '$' 

        //Replace every label with generated label
        if (labelEx.test(lines[i])){
            let curr_labels = lines[i].match(labelEx).map(label => label.slice(0,-1))

            for (const elmt of curr_labels){
                if (Labels.has(elmt)){
                    lines[i] = lines[i].replaceAll(elmt+':','').trim()
                    lines = lines.map(line => line.replace(elmt, gen_label))
                }
            }
        }
    }
    //Remove empty lines generated in this process
    lines = lines.filter((line) => {return !line.match(/(^ *$)/g)})
    return lines
}

function main(){
   // console.log(cleanCode(readFile('code.txt')))
}
main()

export {cleanCode, readFile};