# **RISC V SIMULATOR**

## DETAILS
#### **Team:** *Dragonfly*
#### **Authors:** *Siddhartha G(CS20B040) and Preethi Varsha M(CS20B030)*
#### **Title:** *Phase 1 Report*

## SPECIFICATIONS
* [x] The simulator should support atleast 4kB of memory. *(4 kb of memory is supported)*
* [x] The simulator should read in an assembly file, execute the instructions.  
* [x] Display the contents of the registers, and the memory in the end.
* [x] Run Bubble Sort written in RISC V instructions.
* [x] Any programming language can be used. *(programming language used : javascript)*
* [x] Smulator should support the following RISC-V instructions: ADD/SUB, BNE, JAL(jump),LW/SW
---

## USAGE INSTRUCTIONS/ GUIDE
(Make sure nodejs is installed in the System)
1. In the terminal adjust the directory and run,  

    ```bash
    node main.js
    ```
    The output is now displayed in the console.
2. 10 integers which are to be sorted are already stored in contiguous memory locations whose base address is contained in *array*.
   ```ASM
   .data 
    gap: .space 0
    array:  .word -64, 64, 0, 0, 1, 2, 6, 5, 4, 4
    size: .word 10
    ```

## OUTPUT
![Instructions](./Documentation/Images/Instructions.png)
---  
![Memory and Registers](./Documentation/Images/Reg%20and%20Mem.png)
---
![Complete View](./Documentation/Images/Complete%20View.png) 

## FEATURES:
1. Commenting can be done in the assembly file using '#' before the start of the comment
2. No compulsion for indentation or a specific amount of spacing.
3. Instructions supported:
    1. `add`  `sub`
    2. `lw`  `sw`
    3. `jal`
    4. `bne`  `blt`  `beq`  `bge`
    5. `addi`
    6. `li`  `la`
4. Directives supported:
    1. `.data`
    2. `.text`
    3. `.word`
    4. `.space`
