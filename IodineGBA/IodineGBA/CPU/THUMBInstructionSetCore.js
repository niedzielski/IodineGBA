"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2014 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
/*
 Browsers SHOULD work with switch mode here the best.
 Unfortunately Firefox & Google Chrome do NOT compile this switch.
 This switch SHOULD be converted into a dispatch table 16 bits wide,
 but current JS JIT engines do NOT do so and bail horribly!
 */
var useSwitch = false;
function THUMBInstructionSet(CPUCore) {
    this.CPUCore = CPUCore;
    this.initialize();
}
THUMBInstructionSet.prototype.initialize = function () {
    this.wait = this.CPUCore.wait;
    this.registers = this.CPUCore.registers;
    this.CPSR = this.CPUCore.CPSR;
    this.fetch = 0;
    this.decode = 0;
    this.execute = 0;
    this.stackMemoryCache = new GameBoyAdvanceMemoryCache(this.CPUCore.memory);
    this.instructionMemoryCache = new GameBoyAdvanceTHUMBInstructionMemoryCache(this.CPUCore.memory);
}
if (useSwitch) {
    THUMBInstructionSet.prototype.executeIteration = function () {
        //Push the new fetch access:
        this.fetch = this.instructionMemoryCache.memoryReadFast16(this.registers[0xF] >>> 0) | 0;
        //Execute Instruction:
        this.instructionMap();
        //Update the pipelining state:
        this.execute = this.decode | 0;
        this.decode = this.fetch | 0;
    }
}
else {
    THUMBInstructionSet.prototype.executeIteration = function () {
        //Push the new fetch access:
        this.fetch = this.instructionMemoryCache.memoryReadFast16(this.registers[0xF] >>> 0) | 0;
        //Execute Instruction:
        this.instructionMap[this.execute | 0](this);
        //Update the pipelining state:
        this.execute = this.decode | 0;
        this.decode = this.fetch | 0;
    }
}
THUMBInstructionSet.prototype.executeBubble = function () {
    //Push the new fetch access:
    this.fetch = this.instructionMemoryCache.memoryReadFast16(this.registers[0xF] >>> 0) | 0;
    //Update the pipelining state:
    this.execute = this.decode | 0;
    this.decode = this.fetch | 0;
}
THUMBInstructionSet.prototype.incrementProgramCounter = function () {
    //Increment The Program Counter:
    this.registers[15] = ((this.registers[15] | 0) + 2) | 0;
}
THUMBInstructionSet.prototype.getLR = function () {
    //Read back the value for the LR register upon Exception:
    return ((this.registers[0xF] | 0) - 2) | 0;
}
THUMBInstructionSet.prototype.getIRQLR = function () {
    //Read back the value for the LR register upon IRQ:
    return this.registers[0xF] | 0;
}
THUMBInstructionSet.prototype.getCurrentFetchValue = function () {
    return this.fetch | (this.fetch << 16);
}
function compileInstructionMap() {
    var parentObj = (useSwitch) ? "this" : "o";
    function readLowRegister(address) {
        //Low register read:
        address = address | 0;
        return parentObj + ".registers[" + (address & 0x7) + "]";
    }
    function read0OffsetLowRegister(instruction) {
        //Low register read at 0 bit offset:
        return readLowRegister(instruction | 0);
    }
    function read3OffsetLowRegister(instruction) {
        //Low register read at 3 bit offset:
        return readLowRegister(instruction >> 3);
    }
    function read6OffsetLowRegister(instruction) {
        //Low register read at 6 bit offset:
        return readLowRegister(instruction >> 6);
    }
    function read8OffsetLowRegister(instruction) {
        //Low register read at 8 bit offset:
        return readLowRegister(instruction >> 8);
    }
    function readHighRegister(address) {
        //High register read:
        address = address | 0x8;
        return parentObj + ".registers[" + (address & 0xF) + "]";
    }
    function read0OffsetHighRegister(instruction) {
        //High register read at 0 bit offset:
        return readHighRegister(instruction | 0);
    }
    function read3OffsetHighRegister(instruction) {
        //High register read at 3 bit offset:
        return readHighRegister(instruction >> 3);
    }
    function writeLowRegister(address, data) {
        //Low register write:
        address = address | 0;
        return parentObj + ".registers[" + (address & 0x7) + "] = " + data + ";";
    }
    function write0OffsetLowRegister(instruction, data) {
        //Low register write at 0 bit offset:
        return writeLowRegister(instruction | 0, data);
    }
    function write8OffsetLowRegister(instruction, data) {
        //Low register write at 8 bit offset:
        return writeLowRegister(instruction >> 8, data);
    }
    function guardHighRegisterWrite(instruction, data) {
        var address = 0x8 | (instruction & 0x7);
        if ((address | 0) == 0xF) {
            //We performed a branch:
            return parentObj + ".CPUCore.branch(" + data + " & -2);";
        }
        else {
            //Regular Data Write:
            return parentObj + ".registers[" + (address & 0xF) + "] = " + data + " | 0;";
        }
    }
    function writeSP(data) {
        //Update the stack pointer:
        return parentObj + ".registers[0xD] = " + data + ";";
    }
    function SPDecrementWord() {
        //Decrement the stack pointer by one word:
        return parentObj + ".registers[0xD] = ((" + parentObj + ".registers[0xD] | 0) - 4) | 0;";
    }
    function SPIncrementWord() {
        //Increment the stack pointer by one word:
        return parentObj + ".registers[0xD] = ((" + parentObj + ".registers[0xD] | 0) + 4) | 0;";
    }
    function writeLR(data) {
        //Update the link register:
        return parentObj + ".registers[0xE] = " + data + ";";
    }
    function offsetPC(instruction) {
        //We performed a branch:
        //Update the program counter to branch address:
        return parentObj + ".CPUCore.branch((("+ readPC() + " | 0) + " + ((instruction << 24) >> 23) + ") | 0);";
    }
    function readSP() {
        //Read back the current SP:
        return parentObj + ".registers[0xD]";
    }
    function readLR() {
        //Read back the current LR:
        return parentObj + ".registers[0xE]";
    }
    function readPC() {
        //Read back the current PC:
        return parentObj + ".registers[0xF]";
    }
    function LSLimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += parentObj + ".CPSR.setCarry((source << " + ((offset - 1) | 0) + ") < 0);";
            //Perform shift:
            code += "source <<= " + offset + ";";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(source | 0);";
        code += parentObj + ".CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source | 0");
        return code;
    }
    function LSRimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += parentObj + ".CPSR.setCarry(((source >> " + ((offset - 1) | 0) + ") & 0x1) != 0);";
            //Perform shift:
            code += "source = (source >>> " + offset + ") | 0;";
        }
        else {
            code += parentObj + ".CPSR.setCarry(source < 0);";
            code += "source = 0;";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(source | 0);";
        code += parentObj + ".CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source | 0");
        return code;
    }
    function ASRimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += parentObj + ".CPSR.setCarry(((source >> " + ((offset - 1) | 0) + ") & 0x1) != 0);";
            //Perform shift:
            code += "source >>= " + offset + ";";
        }
        else {
            code += parentObj + ".CPSR.setCarry(source < 0);";
            code += "source >>= 0x1F;";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(source | 0);";
        code += parentObj + ".CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source | 0");
        return code;
    }
    function ADDreg(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = read6OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ") | 0");
        return code;
    }
    function SUBreg(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = read6OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ") | 0");
        return code;
    }
    function ADDimm3(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = (instruction >> 6) & 0x7;
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ") | 0");
        return code;
    }
    function SUBimm3(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = (instruction >> 6) & 0x7;
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ") | 0");
        return code;
    }
    function MOVimm8(instruction) {
        //Get the 8-bit value to move into the register:
        var result = instruction & 0xFF;
        var code = parentObj + ".CPSR.setNegativeFalse();";
        code += parentObj + ".CPSR.setZeroInt(" + result + ");";
        //Update destination register:
        code += write8OffsetLowRegister(instruction, result);
        return code;
    }
    function CMPimm8(instruction) {
        //Compare an 8-bit immediate value with a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + ");";
        return code;
    }
    function ADDimm8(instruction) {
        //Add an 8-bit immediate value with a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = write8OffsetLowRegister(instruction, parentObj + ".CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ")");
        return code;
    }
    function SUBimm8(instruction) {
        //Subtract an 8-bit immediate value from a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = write8OffsetLowRegister(instruction, parentObj + ".CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ")");
        return code;
    }
    function AND(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise AND:
        var code = "var result = " + source + " & " + destination + ";";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result | 0");
        return code;
    }
    function EOR(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise EOR:
        var code = "var result = " + source + " ^ " + destination + ";";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result | 0");
        return code;
    }
    function LSL(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data left:
                code += parentObj + ".CPSR.setCarry((destination << ((source - 1) | 0)) < 0);";
                code += "destination <<= source;";
            code += "}";
            code += "else if (source == 0x20) {";
                //Shift bit 0 into carry:
                code += parentObj + ".CPSR.setCarry((destination & 0x1) == 0x1);";
                code += "destination = 0;";
            code += "}";
            code += "else {";
                //Everything Zero'd:
                code += parentObj + ".CPSR.setCarryFalse();";
                code += "destination = 0;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(destination | 0);";
        code += parentObj + ".CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination | 0");
        return code;
    }
    function LSR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data right logically:
                code += parentObj + ".CPSR.setCarry(((destination >> ((source - 1) | 0)) & 0x1) == 0x1);";
                code += "destination = (destination >>> source) | 0;";
            code += "}";
            code += "else if (source == 0x20) {";
                //Shift bit 31 into carry:
                code += parentObj + ".CPSR.setCarry(destination < 0);";
                code += "destination = 0;";
            code += "}";
            code += "else {";
                //Everything Zero'd:
                code += parentObj + ".CPSR.setCarryFalse();";
                code += "destination = 0;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(destination | 0);";
        code += parentObj + ".CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination | 0");
        return code;
    }
    function ASR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data right arithmetically:
                code += parentObj + ".CPSR.setCarry(((destination >> ((source - 1) | 0)) & 0x1) == 0x1);";
                code += "destination >>= source;";
            code += "}";
            code += "else {";
                //Set all bits with bit 31:
                code += parentObj + ".CPSR.setCarry(destination < 0);";
                code += "destination >>= 0x1F;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(destination | 0);";
        code += parentObj + ".CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination | 0");
        return code;
    }
    function ADC(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setADCFlags(" + operand1 + " | 0, " + operand2 + " | 0) | 0");
        return code;
    }
    function SBC(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, parentObj + ".CPSR.setSBCFlags(" + operand1 + " | 0, " + operand2 + " | 0) | 0");
        return code;
    }
    function ROR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        code += "if (source > 0) {";
            code += "source &= 0x1F;";
            code += "if (source > 0) {";
                //CPSR Carry is set by the last bit shifted out:
                code += parentObj + ".CPSR.setCarry(((destination >>> ((source - 1) | 0)) & 0x1) != 0);";
                //Perform rotate:
                code += "destination = (destination << ((0x20 - source) | 0)) | (destination >>> (source | 0));";
            code += "}";
            code += "else {";
                code += parentObj + ".CPSR.setCarry(destination < 0);";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += parentObj + ".CPSR.setNegativeInt(destination | 0);";
        code += parentObj + ".CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination | 0");
        return code;
    }
    function TST(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise AND:
        var code = "var result = " + source + " & " + destination + ";";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        return code;
    }
    function NEG(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        code += parentObj + ".CPSR.setOverflow((source ^ (-(source | 0))) == 0);";
        //Perform Subtraction:
        code += "source = (-(source | 0)) | 0;";
        code += parentObj + ".CPSR.setNegativeInt(source | 0);";
        code += parentObj + ".CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source | 0");
        return code;
    }
    function CMP(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function CMN(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = parentObj + ".CPSR.setCMNFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function ORR(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise OR:
        var code = "var result = " + source + " | " + destination + ";";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result | 0");
        return code;
    }
    function MUL(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform MUL32:
        var code = "var result = " + parentObj + ".CPUCore.performMUL32(" + source + " | 0, " + destination + " | 0, 0) | 0;";
        code += parentObj + ".CPSR.setCarryFalse();";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result | 0");
        return code;
    }
    function BIC(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise AND with a bitwise NOT on source:
        var code = "var result = (~" + source + ") & " + destination + ";";
        code += parentObj + ".CPSR.setNegativeInt(result | 0);";
        code += parentObj + ".CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result | 0");
        return code;
    }
    function MVN(instruction) {
        //Perform bitwise NOT on source:
        var code = "var source = ~" + read3OffsetLowRegister(instruction) + ";";
        code += parentObj + ".CPSR.setNegativeInt(source | 0);";
        code += parentObj + ".CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source | 0");
        return code;
    }
    function ADDH_LL(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Perform Addition:
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "((" + operand1 + " | 0) + (" + operand2 + " | 0)) | 0");
        return code;
    }
    function ADDH_LH(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetHighRegister(instruction);
        //Perform Addition:
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "((" + operand1 + " | 0) + (" + operand2 + " | 0)) | 0");
        return code;
    }
    function ADDH_HL(instruction) {
        var operand1 = read0OffsetHighRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Perform Addition:
        //Update destination register:
        var code = guardHighRegisterWrite(instruction, "((" + operand1 + " | 0) + (" + operand2 + " | 0))");
        return code;
    }
    function ADDH_HH(instruction) {
        var operand1 = read0OffsetHighRegister(instruction);
        var operand2 = read3OffsetHighRegister(instruction);
        //Perform Addition:
        //Update destination register:
        var code = guardHighRegisterWrite(instruction, "((" + operand1 + " | 0) + (" + operand2 + " | 0))");
        return code;
    }
    function CMPH_LL(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function CMPH_LH(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetHighRegister(instruction);
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function CMPH_HL(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetHighRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function CMPH_HH(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetHighRegister(instruction);
        var operand2 = read3OffsetHighRegister(instruction);
        var code = parentObj + ".CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return code;
    }
    function MOVH_LL(instruction) {
        //Move a register to another register:
        var code = write0OffsetLowRegister(instruction, read3OffsetLowRegister(instruction));
        return code;
    }
    function MOVH_LH(instruction) {
        //Move a register to another register:
        var code = write0OffsetLowRegister(instruction, read3OffsetHighRegister(instruction));
        return code;
    }
    function MOVH_HL(instruction) {
        //Move a register to another register:
        var code = guardHighRegisterWrite(instruction, read3OffsetLowRegister(instruction));
        return code;
    }
    function MOVH_HH(instruction) {
        //Move a register to another register:
        var code = guardHighRegisterWrite(instruction, read3OffsetHighRegister(instruction));
        return code;
    }
    function BX_L(instruction) {
        //Branch & eXchange:
        var code = "var address = " + read3OffsetLowRegister(instruction) + " | 0;";
        code += "if ((address & 0x1) == 0) {";
            //Enter ARM mode:
            code += parentObj + ".CPUCore.enterARM();";
            code += parentObj + ".CPUCore.branch(address & -0x4);";
        code += "}";
        code += "else {";
            //Stay in THUMB mode:
            code += parentObj + ".CPUCore.branch(address & -0x2);";
        code += "}";
        return code;
    }
    function BX_H(instruction) {
        //Branch & eXchange:
        var code = "var address = " + read3OffsetHighRegister(instruction) + " | 0;";
        code += "if ((address & 0x1) == 0) {";
            //Enter ARM mode:
            code += parentObj + ".CPUCore.enterARM();";
            code += parentObj + ".CPUCore.branch(address & -0x4);";
        code += "}";
        code += "else {";
            //Stay in THUMB mode:
            code += parentObj + ".CPUCore.branch(address & -0x2);";
        code += "}";
        return code;
    }
    function LDRPC(instruction) {
        //PC-Relative Load
        var code = "var data = " + parentObj + ".CPUCore.read32(((" + readPC() + " & -3) + " + ((instruction & 0xFF) << 2) + ") | 0) | 0;";
        code += write8OffsetLowRegister(instruction, "data");
        return code;
    }
    function STRreg(instruction) {
        //Store Word From Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write32(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function STRHreg(instruction) {
        //Store Half-Word From Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write16(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function STRBreg(instruction) {
        //Store Byte From Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write8(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function LDRSBreg(instruction) {
        //Load Signed Byte Into Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = "(" + parentObj + ".CPUCore.read8(" + address + ") << 24) >> 24";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function LDRreg(instruction) {
        //Load Word Into Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read32(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function LDRHreg(instruction) {
        //Load Half-Word Into Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read16(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function LDRBreg(instruction) {
        //Load Byte Into Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read8(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function LDRSHreg(instruction) {
        //Load Signed Half-Word Into Register
        var address = "((" + read6OffsetLowRegister(instruction) + " | 0) + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = "(" + parentObj + ".CPUCore.read16(" + address + ") << 16) >> 16";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function STRimm5(instruction) {
        //Store Word From Register
        var address = "(" + ((instruction >> 4) & 0x7C) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write32(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function LDRimm5(instruction) {
        //Load Word Into Register
        var address = "(" + ((instruction >> 4) & 0x7C) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read32(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function STRBimm5(instruction) {
        //Store Byte From Register
        var address = "(" + ((instruction >> 6) & 0x1F) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write8(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function LDRBimm5(instruction) {
        //Load Byte Into Register
        var address = "(" + ((instruction >> 6) & 0x1F) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read8(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function STRHimm5(instruction) {
        //Store Half-Word From Register
        var address = "(" + ((instruction >> 5) & 0x3E) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write16(" + address + ", " + read0OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function LDRHimm5(instruction) {
        //Load Half-Word Into Register
        var address = "(" + ((instruction >> 5) & 0x3E) + " + (" + read3OffsetLowRegister(instruction) + " | 0)) | 0";
        var data = parentObj + ".CPUCore.read16(" + address + ") | 0";
        var code = write0OffsetLowRegister(instruction, data);
        return code;
    }
    function STRSP(instruction) {
        //Store Word From Register
        var address = "(" + ((instruction & 0xFF) << 2) + " + (" + readSP() + " | 0)) | 0";
        var code = parentObj + ".CPUCore.write32(" + address + ", " + read8OffsetLowRegister(instruction) + " | 0);";
        return code;
    }
    function LDRSP(instruction) {
        //Load Word Into Register
        var data = parentObj + ".CPUCore.read32((" + ((instruction & 0xFF) << 2) + " + (" + readSP() + " | 0)) | 0) | 0";
        var code = write8OffsetLowRegister(instruction, data);
        return code;
    }
    function ADDPC(instruction) {
        //Add PC With Offset Into Register
        var data = "((" + readPC() + " & -3) + " + ((instruction & 0xFF) << 2) + ") | 0";
        var code = write8OffsetLowRegister(instruction, data);
        return code;
    }
    function ADDSP(instruction) {
        //Add SP With Offset Into Register
        var data = "((" + readSP() + " | 0) + " + ((instruction & 0xFF) << 2) + ") | 0";
        var code = write8OffsetLowRegister(instruction, data);
        return code;
    }
    function ADDSPimm7(instruction) {
        //Add Signed Offset Into SP
        var offset = (instruction & 0x7F) << 2;
        if ((instruction & 0x80) != 0) {
            var code = writeSP("((" + readSP() + " | 0) - " + offset + ") | 0");
        }
        else {
            var code = writeSP("((" + readSP() + " | 0) + " + offset + ") | 0");
        }
        return code;
    }
    function PUSH(instruction) {
        //Only initialize the PUSH sequence if the register list is non-empty:
        var code = "";
        if ((instruction & 0xFF) > 0) {
            //Updating the address bus away from PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
            //Push register(s) onto the stack:
            for (var rListPosition = 7; (rListPosition | 0) > -1; rListPosition = ((rListPosition | 0) - 1) | 0) {
                if ((instruction & (1 << rListPosition)) != 0) {
                    //Push register onto the stack:
                    code += SPDecrementWord();
                    code += parentObj + ".stackMemoryCache.memoryWrite32(" + readSP() + " >>> 0, " + readLowRegister(rListPosition | 0) + " | 0);";
                }
            }
            //Updating the address bus back to PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
        }
        return code;
    }
    function PUSHlr(instruction) {
        //Updating the address bus away from PC fetch:
        var code = parentObj + ".wait.NonSequentialBroadcast();";
        //Push link register onto the stack:
        code += SPDecrementWord();
        code += parentObj + ".stackMemoryCache.memoryWrite32(" + readSP() + " >>> 0, " + readLR() + " | 0);";
        //Push register(s) onto the stack:
        for (var rListPosition = 7; (rListPosition | 0) > -1; rListPosition = ((rListPosition | 0) - 1) | 0) {
            if ((instruction & (1 << rListPosition)) != 0) {
                //Push register onto the stack:
                code += SPDecrementWord();
                code += parentObj + ".stackMemoryCache.memoryWrite32(" + readSP() + " >>> 0, " + readLowRegister(rListPosition | 0) + " | 0);";
            }
        }
        //Updating the address bus back to PC fetch:
        code += parentObj + ".wait.NonSequentialBroadcast();";
        return code;
    }
    function POP(instruction) {
        //Only initialize the POP sequence if the register list is non-empty:
        var code = "";
        if ((instruction & 0xFF) > 0) {
            //Updating the address bus away from PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
            //POP stack into register(s):
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((instruction & (1 << rListPosition)) != 0) {
                    //POP stack into a register:
                    code += writeLowRegister(rListPosition | 0, parentObj + ".stackMemoryCache.memoryRead32(" + readSP() + " >>> 0) | 0");
                    code += SPIncrementWord();
                }
            }
            //Updating the address bus back to PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
        }
        return code;
    }
    function POPpc(instruction) {
        //Updating the address bus away from PC fetch:
        var code = parentObj + ".wait.NonSequentialBroadcast();";
        //POP stack into register(s):
        for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
            if ((instruction & (1 << rListPosition)) != 0) {
                //POP stack into a register:
                code += writeLowRegister(rListPosition | 0, parentObj + ".stackMemoryCache.memoryRead32(" + readSP() + " >>> 0) | 0");
                code += SPIncrementWord();
            }
        }
        //POP stack into the program counter (r15):
        //We performed a branch:
        //Update the program counter to branch address:
        code += parentObj + ".CPUCore.branch(" + parentObj + ".stackMemoryCache.memoryRead32(" + readSP() + " >>> 0) & -2);";
        code += SPIncrementWord();
        //Updating the address bus back to PC fetch:
        code += parentObj + ".wait.NonSequentialBroadcast();";
        return code;
    }
    function STMIA(instruction) {
        //Only initialize the STMIA sequence if the register list is non-empty:
        var code = "";
        if ((instruction & 0xFF) > 0) {
            //Get the base address:
            code += "var currentAddress = " + read8OffsetLowRegister(instruction) + " | 0;";
            //Updating the address bus away from PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
            //Push register(s) into memory:
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((instruction & (1 << rListPosition)) != 0) {
                    //Push a register into memory:
                    code += parentObj + ".stackMemoryCache.memoryWrite32(currentAddress >>> 0, " + readLowRegister(rListPosition | 0) + " | 0);";
                    code += "currentAddress = ((currentAddress | 0) + 4) | 0;";
                }
            }
            //Store the updated base address back into register:
            code += write8OffsetLowRegister(instruction, "currentAddress | 0");
            //Updating the address bus back to PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
        }
        return code;
    }
    function LDMIA(instruction) {
        //Only initialize the LDMIA sequence if the register list is non-empty:
        var code = "";
        if ((instruction & 0xFF) > 0) {
            //Get the base address:
            code += "var currentAddress = " + read8OffsetLowRegister(instruction) + " | 0;";
            //Updating the address bus away from PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
            //Load  register(s) from memory:
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((instruction & (1 << rListPosition)) != 0) {
                    //Load a register from memory:
                    code += writeLowRegister(rListPosition | 0, parentObj + ".stackMemoryCache.memoryRead32(currentAddress >>> 0) | 0");
                    code += "currentAddress = ((currentAddress | 0) + 4) | 0;";
                }
            }
            //Store the updated base address back into register:
            code += write8OffsetLowRegister(instruction, "currentAddress | 0");
            //Updating the address bus back to PC fetch:
            code += parentObj + ".wait.NonSequentialBroadcast();";
        }
        return code;
    }
    function BEQ(instruction) {
        //Branch if EQual:
        var code = "if (" + parentObj + ".CPSR.getZero()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BNE(instruction) {
        //Branch if Not Equal:
        var code = "if (!" + parentObj + ".CPSR.getZero()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BCS(instruction) {
        //Branch if Carry Set:
        var code = "if (" + parentObj + ".CPSR.getCarry()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BCC(instruction) {
        //Branch if Carry Clear:
        var code = "if (!" + parentObj + ".CPSR.getCarry()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BMI(instruction) {
        //Branch if Negative Set:
        var code = "if (" + parentObj + ".CPSR.getNegative()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BPL(instruction) {
        //Branch if Negative Clear:
        var code = "if (!" + parentObj + ".CPSR.getNegative()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BVS(instruction) {
        //Branch if Overflow Set:
        var code = "if (" + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BVC(instruction) {
        //Branch if Overflow Clear:
        var code = "if (!" + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BHI(instruction) {
        //Branch if Carry & Non-Zero:
        var code = "if (" + parentObj + ".CPSR.getCarry() && !" + parentObj + ".CPSR.getZero()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BLS(instruction) {
        //Branch if Carry Clear or is Zero Set:
        var code = "if (!" + parentObj + ".CPSR.getCarry() || " + parentObj + ".CPSR.getZero()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BGE(instruction) {
        //Branch if Negative equal to Overflow
        var code = "if (" + parentObj + ".CPSR.getNegative() == " + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BLT(instruction) {
        //Branch if Negative NOT equal to Overflow
        var code = "if (" + parentObj + ".CPSR.getNegative() != " + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BGT(instruction) {
        //Branch if Zero Clear and Negative equal to Overflow
        var code = "if (!" + parentObj + ".CPSR.getZero() && " + parentObj + ".CPSR.getNegative() == " + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function BLE(instruction) {
        //Branch if Zero Set or Negative NOT equal to Overflow
        var code = "if (" + parentObj + ".CPSR.getZero() || " + parentObj + ".CPSR.getNegative() != " + parentObj + ".CPSR.getOverflow()) {";
            code += offsetPC(instruction);
        code += "}";
        return code;
    }
    function SWI(instruction) {
        //Software Interrupt:
        var code = parentObj + ".CPUCore.SWI();";
        return code;
    }
    function B(instruction) {
        //Unconditional Branch:
        //Update the program counter to branch address:
        var code = parentObj + ".CPUCore.branch(((" + readPC() + " | 0) + " + ((instruction << 21) >> 20) + ") | 0);";
        return code;
    }
    function BLsetup(instruction) {
        //Brank with Link (High offset)
        //Update the link register to branch address:
        var code = writeLR("((" + readPC() + " | 0) + " + (((instruction & 0x7FF) << 21) >> 9) + ") | 0");
        return code;
    }
    function BLoff(instruction) {
        //Brank with Link (Low offset)
        //Update the link register to branch address:
        var code = writeLR("((" + readLR() + " | 0) + " + ((instruction & 0x7FF) << 1) + ") | 0");
        //Copy LR to PC:
        code += "var oldPC = " + readPC() + " | 0;";
        //Flush Pipeline & Block PC Increment:
        code += parentObj + ".CPUCore.branch(" + readLR() + " & -0x2);";
        //Set bit 0 of LR high:
        code += writeLR("((oldPC | 0) - 0x2) | 0x1");
        return code;
    }
    function UNDEFINED(instruction) {
        //Undefined Exception:
        var code = parentObj + ".CPUCore.UNDEFINED();";
        return code;
    }
    var instructionMap = [];
    function generateLowMap(instruction) {
        for (var index = 0; index < 0x20; ++index) {
            instructionMap.push(instruction);
        }
    }
    function generateLowMap2(instruction) {
        for (var index = 0; index < 0x8; ++index) {
            instructionMap.push(instruction);
        }
    }
    function generateLowMap3(instruction) {
        for (var index = 0; index < 0x4; ++index) {
            instructionMap.push(instruction);
        }
    }
    function generateLowMap4(instruction1, instruction2, instruction3, instruction4) {
        instructionMap.push(instruction1);
        instructionMap.push(instruction2);
        instructionMap.push(instruction3);
        instructionMap.push(instruction4);
    }
    //0-7
    generateLowMap(LSLimm);
    //8-F
    generateLowMap(LSRimm);
    //10-17
    generateLowMap(ASRimm);
    //18-19
    generateLowMap2(ADDreg);
    //1A-1B
    generateLowMap2(SUBreg);
    //1C-1D
    generateLowMap2(ADDimm3);
    //1E-1F
    generateLowMap2(SUBimm3);
    //20-27
    generateLowMap(MOVimm8);
    //28-2F
    generateLowMap(CMPimm8);
    //30-37
    generateLowMap(ADDimm8);
    //38-3F
    generateLowMap(SUBimm8);
    //40
    generateLowMap4(AND, EOR, LSL, LSR);
    //41
    generateLowMap4(ASR, ADC, SBC, ROR);
    //42
    generateLowMap4(TST, NEG, CMP, CMN);
    //43
    generateLowMap4(ORR, MUL, BIC, MVN);
    //44
    generateLowMap4(ADDH_LL, ADDH_LH, ADDH_HL, ADDH_HH);
    //45
    generateLowMap4(CMPH_LL, CMPH_LH, CMPH_HL, CMPH_HH);
    //46
    generateLowMap4(MOVH_LL, MOVH_LH, MOVH_HL, MOVH_HH);
    //47
    generateLowMap4(BX_L, BX_H, BX_L, BX_H);
    //48-4F
    generateLowMap(LDRPC);
    //50-51
    generateLowMap2(STRreg);
    //52-53
    generateLowMap2(STRHreg);
    //54-55
    generateLowMap2(STRBreg);
    //56-57
    generateLowMap2(LDRSBreg);
    //58-59
    generateLowMap2(LDRreg);
    //5A-5B
    generateLowMap2(LDRHreg);
    //5C-5D
    generateLowMap2(LDRBreg);
    //5E-5F
    generateLowMap2(LDRSHreg);
    //60-67
    generateLowMap(STRimm5);
    //68-6F
    generateLowMap(LDRimm5);
    //70-77
    generateLowMap(STRBimm5);
    //78-7F
    generateLowMap(LDRBimm5);
    //80-87
    generateLowMap(STRHimm5);
    //88-8F
    generateLowMap(LDRHimm5);
    //90-97
    generateLowMap(STRSP);
    //98-9F
    generateLowMap(LDRSP);
    //A0-A7
    generateLowMap(ADDPC);
    //A8-AF
    generateLowMap(ADDSP);
    //B0
    generateLowMap3(ADDSPimm7);
    //B1
    generateLowMap3(UNDEFINED);
    //B2
    generateLowMap3(UNDEFINED);
    //B3
    generateLowMap3(UNDEFINED);
    //B4
    generateLowMap3(PUSH);
    //B5
    generateLowMap3(PUSHlr);
    //B6
    generateLowMap3(UNDEFINED);
    //B7
    generateLowMap3(UNDEFINED);
    //B8
    generateLowMap3(UNDEFINED);
    //B9
    generateLowMap3(UNDEFINED);
    //BA
    generateLowMap3(UNDEFINED);
    //BB
    generateLowMap3(UNDEFINED);
    //BC
    generateLowMap3(POP);
    //BD
    generateLowMap3(POPpc);
    //BE
    generateLowMap3(UNDEFINED);
    //BF
    generateLowMap3(UNDEFINED);
    //C0-C7
    generateLowMap(STMIA);
    //C8-CF
    generateLowMap(LDMIA);
    //D0
    generateLowMap3(BEQ);
    //D1
    generateLowMap3(BNE);
    //D2
    generateLowMap3(BCS);
    //D3
    generateLowMap3(BCC);
    //D4
    generateLowMap3(BMI);
    //D5
    generateLowMap3(BPL);
    //D6
    generateLowMap3(BVS);
    //D7
    generateLowMap3(BVC);
    //D8
    generateLowMap3(BHI);
    //D9
    generateLowMap3(BLS);
    //DA
    generateLowMap3(BGE);
    //DB
    generateLowMap3(BLT);
    //DC
    generateLowMap3(BGT);
    //DD
    generateLowMap3(BLE);
    //DE
    generateLowMap3(UNDEFINED);
    //DF
    generateLowMap3(SWI);
    //E0-E7
    generateLowMap(B);
    //E8-EF
    generateLowMap(UNDEFINED);
    //F0-F7
    generateLowMap(BLsetup);
    //F8-FF
    generateLowMap(BLoff);
    //Set the map to prototype:
    var selfGen = "THUMBInstructionSet.prototype.instructionMap = ";
    if (useSwitch) {
        selfGen += "function () {";
            selfGen += "\tswitch (this.execute | 0) {\n";
                for (var opcode = 0; opcode < 0x10000; opcode++) {
                    selfGen += "\t\tcase " + opcode + ":\n\t\t\t";
                        selfGen += instructionMap[opcode >> 6](opcode);
                        selfGen += "\n\t\t\tbreak;\n";              //We do NOT have cascading cases, should be very easy to optimize then!
                }
            selfGen += "\t}";
        selfGen += "}";
    }
    else {
        selfGen += "[";
        for (var opcode = 0; opcode < 0x10000; opcode++) {
            selfGen += "function (" + parentObj + ") {";
                selfGen += instructionMap[opcode >> 6](opcode);
            selfGen += "}";
            if (opcode < 0xFFFF) {
                selfGen += ",";
            }
        }
        selfGen += "]";
    }
    selfGen += ";";
    eval(selfGen);
}
compileInstructionMap();