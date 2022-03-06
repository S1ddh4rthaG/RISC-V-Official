# ██████╗░██╗░░░██╗██████╗░██████╗░██╗░░░░░███████╗  ░██████╗░█████╗░██████╗░████████╗
# ██╔══██╗██║░░░██║██╔══██╗██╔══██╗██║░░░░░██╔════╝  ██╔════╝██╔══██╗██╔══██╗╚══██╔══╝
# ██████╦╝██║░░░██║██████╦╝██████╦╝██║░░░░░█████╗░░  ╚█████╗░██║░░██║██████╔╝░░░██║░░░
# ██╔══██╗██║░░░██║██╔══██╗██╔══██╗██║░░░░░██╔══╝░░  ░╚═══██╗██║░░██║██╔══██╗░░░██║░░░
# ██████╦╝╚██████╔╝██████╦╝██████╦╝███████╗███████╗  ██████╔╝╚█████╔╝██║░░██║░░░██║░░░
# ╚═════╝░░╚═════╝░╚═════╝░╚═════╝░╚══════╝╚══════╝  ╚═════╝░░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░
# 
# Name: Bubble Sort
# Author: Siddhartha G and Preethi Varsha M

.data 
    gap: .space 0
    array:  .word -64, 64, 0, 0, 1, 2, 6, 5, 4, 4
    size: .word 10

.text
    la x8, 0(array)     # Load address of first element 
    la x9, 0(size)      # Load size of the array(n)

    li x5, 0            # OUTER LOOP i == 0
    OUTER:
        beq x5, x9, SORTED      # for i = 0 to n-1 so i == n break
            li x6, 0            # j = 0
            la x30, 0(x8)       # load address of first element of array

            sub x7, x9, x5      # j = 0 to n-i-1 
            INNER:
                beq x6, x7, EXIT        # j == n-i break
                    lw x18, 0(x30)      # A[j]   
                    lw x19, 4(x30)      # A[j+1]    
                    
                    blt x18, x19, LESS      # if A[j] < A[j+1] inorder so break
                        sw x19, 0(x30)      # swap them
                        sw x18, 4(x30)
                    LESS:
                    addi x6, x6, 1          # j = j + 1
                    addi x30, x30, 4        # addr(j+1)
                    jal x1, INNER
            EXIT:
        addi x5, x5, 1  
        jal x1, OUTER
    SORTED:
        #done sorting
                