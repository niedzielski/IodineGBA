"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
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
THUMBInstructionSet.prototype.executeIteration = function () {
    //Push the new fetch access:
    this.fetch = this.instructionMemoryCache.memoryReadFast16(this.readPC() >>> 0) | 0;
    //Execute Instruction:
    this.instructionMap[this.execute | 0](this);
    //Update the pipelining state:
    this.execute = this.decode | 0;
    this.decode = this.fetch | 0;
}
THUMBInstructionSet.prototype.executeBubble = function () {
    //Push the new fetch access:
    this.fetch = this.instructionMemoryCache.memoryReadFast16(this.readPC() >>> 0) | 0;
    //Update the pipelining state:
    this.execute = this.decode | 0;
    this.decode = this.fetch | 0;
}
THUMBInstructionSet.prototype.incrementProgramCounter = function () {
    //Increment The Program Counter:
    this.registers[15] = ((this.registers[15] | 0) + 2) | 0;
}

THUMBInstructionSet.prototype.readLowRegister = function (address) {
    //Low register read:
    address = address | 0;
    return this.registers[address & 0x7] | 0;
}
THUMBInstructionSet.prototype.read0OffsetLowRegister = function () {
    //Low register read at 0 bit offset:
    return this.readLowRegister(this.execute | 0) | 0;
}
THUMBInstructionSet.prototype.read3OffsetLowRegister = function () {
    //Low register read at 3 bit offset:
    return this.readLowRegister(this.execute >> 3) | 0;
}
THUMBInstructionSet.prototype.read6OffsetLowRegister = function () {
    //Low register read at 6 bit offset:
    return this.readLowRegister(this.execute >> 6) | 0;
}
THUMBInstructionSet.prototype.read8OffsetLowRegister = function () {
    //Low register read at 8 bit offset:
    return this.readLowRegister(this.execute >> 8) | 0;
}
THUMBInstructionSet.prototype.readHighRegister = function (address) {
    //High register read:
    address = address | 0x8;
    return this.registers[address & 0xF] | 0;
}
THUMBInstructionSet.prototype.writeLowRegister = function (address, data) {
    //Low register write:
    address = address | 0;
    data = data | 0;
    this.registers[address & 0x7] = data | 0;
}
THUMBInstructionSet.prototype.write0OffsetLowRegister = function (data) {
    //Low register write at 0 bit offset:
    data = data | 0;
    this.writeLowRegister(this.execute | 0, data | 0);
}
THUMBInstructionSet.prototype.write8OffsetLowRegister = function (data) {
    //Low register write at 8 bit offset:
    data = data | 0;
    this.writeLowRegister(this.execute >> 8, data | 0);
}
THUMBInstructionSet.prototype.guardHighRegisterWrite = function (data) {
    data = data | 0;
    var address = 0x8 | (this.execute & 0x7);
    if ((address | 0) == 0xF) {
        //We performed a branch:
        this.CPUCore.branch(data & -2);
    }
    else {
        //Regular Data Write:
        this.registers[address & 0xF] = data | 0;
    }
}
THUMBInstructionSet.prototype.writeSP = function (data) {
    //Update the stack pointer:
    data = data | 0;
    this.registers[0xD] = data | 0;
}
THUMBInstructionSet.prototype.SPDecrementWord = function () {
    //Decrement the stack pointer by one word:
    this.registers[0xD] = ((this.registers[0xD] | 0) - 4) | 0;
}
THUMBInstructionSet.prototype.SPIncrementWord = function () {
    //Increment the stack pointer by one word:
    this.registers[0xD] = ((this.registers[0xD] | 0) + 4) | 0;
}
THUMBInstructionSet.prototype.writeLR = function (data) {
    //Update the link register:
    data = data | 0;
    this.registers[0xE] = data | 0;
}
THUMBInstructionSet.prototype.writePC = function (data) {
    data = data | 0;
    //We performed a branch:
    //Update the program counter to branch address:
    this.CPUCore.branch(data & -2);
}
THUMBInstructionSet.prototype.offsetPC = function () {
    //We performed a branch:
    //Update the program counter to branch address:
    this.CPUCore.branch(((this.readPC() | 0) + ((this.execute << 24) >> 23)) | 0);
}
THUMBInstructionSet.prototype.readSP = function () {
    //Read back the current SP:
    return this.registers[0xD] | 0;
}
THUMBInstructionSet.prototype.readLR = function () {
    //Read back the current LR:
    return this.registers[0xE] | 0;
}
THUMBInstructionSet.prototype.readPC = function () {
    //Read back the current PC:
    return this.registers[0xF] | 0;
}

THUMBInstructionSet.prototype.getLR = function () {
    //Read back the value for the LR register upon Exception:
    return ((this.readPC() | 0) - 2) | 0;
}
THUMBInstructionSet.prototype.getIRQLR = function () {
    //Read back the value for the LR register upon IRQ:
    return this.readPC() | 0;
}
THUMBInstructionSet.prototype.getCurrentFetchValue = function () {
    return this.fetch | (this.fetch << 16);
}
function compileInstructionMap() {
    function readLowRegister(address) {
        //Low register read:
        address = address | 0;
        return "parentObj.registers[" + (address & 0x7) + "]";
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
        return "parentObj.registers[" + (address & 0xF) + "]";
    }
    function writeLowRegister(address, data) {
        //Low register write:
        address = address | 0;
        return "parentObj.registers[" + (address & 0x7) + "] = " + data + ((typeof data == "number") ? ";" : " | 0;");
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
            return "parentObj.CPUCore.branch(" + data + " & -2);";
        }
        else {
            //Regular Data Write:
            return "parentObj.registers[" + (address & 0xF) + "] = " + data + " | 0;";
        }
    }
    function writeSP(data) {
        //Update the stack pointer:
        return "parentObj.registers[0xD] = " + data + ";";
    }
    function SPDecrementWord() {
        //Decrement the stack pointer by one word:
        return "parentObj.registers[0xD] = ((parentObj.registers[0xD] | 0) - 4) | 0;";
    }
    function SPIncrementWord() {
        //Increment the stack pointer by one word:
        return "parentObj.registers[0xD] = ((parentObj.registers[0xD] | 0) + 4) | 0;";
    }
    function writeLR(data) {
        //Update the link register:
        return "parentObj.registers[0xE] = " + data + ";";
    }
    function offsetPC(instruction) {
        //We performed a branch:
        //Update the program counter to branch address:
        return "parentObj.CPUCore.branch((("+ readPC() + " | 0) + " + ((instruction << 24) >> 23) + ") | 0);";
    }
    function readSP() {
        //Read back the current SP:
        return "parentObj.registers[0xD]";
    }
    function readLR() {
        //Read back the current LR:
        return "parentObj.registers[0xE]";
    }
    function readPC() {
        //Read back the current PC:
        return "parentObj.registers[0xF]";
    }
    function LSLimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += "parentObj.CPSR.setCarry((source << " + ((offset - 1) | 0) + ") < 0);";
            //Perform shift:
            code += "source <<= " + offset + ";";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(source | 0);";
        code += "parentObj.CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source");
        return Function("parentObj", code);
    }
    function LSRimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += "parentObj.CPSR.setCarry(((source >> " + ((offset - 1) | 0) + ") & 0x1) != 0);";
            //Perform shift:
            code += "source = (source >>> " + offset + ") | 0;";
        }
        else {
            code += "parentObj.CPSR.setCarry(source < 0);";
            code += "source = 0;";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(source | 0);";
        code += "parentObj.CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source");
        return Function("parentObj", code);
    }
    function ASRimm(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        var offset = (instruction >> 6) & 0x1F;
        if (offset > 0) {
            //CPSR Carry is set by the last bit shifted out:
            code += "parentObj.CPSR.setCarry(((source >> " + ((offset - 1) | 0) + ") & 0x1) != 0);";
            //Perform shift:
            code += "source >>= " + offset + ";";
        }
        else {
            code += "parentObj.CPSR.setCarry(source < 0);";
            code += "source >>= 0x1F;";
        }
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(source | 0);";
        code += "parentObj.CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source");
        return Function("parentObj", code);
    }
    function ADDreg(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = read6OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function SUBreg(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = read6OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function ADDimm3(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = (instruction >> 6) & 0x7;
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function SUBimm3(instruction) {
        var operand1 = read3OffsetLowRegister(instruction);
        var operand2 = (instruction >> 6) & 0x7;
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function MOVimm8(instruction) {
        //Get the 8-bit value to move into the register:
        var result = instruction & 0xFF;
        var code = "parentObj.CPSR.setNegativeFalse();";
        code += "parentObj.CPSR.setZeroInt(" + result + ");";
        //Update destination register:
        code += write8OffsetLowRegister(instruction, result);
        return Function("parentObj", code);
    }
    function CMPimm8(instruction) {
        //Compare an 8-bit immediate value with a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = "parentObj.CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + ");";
        return Function("parentObj", code);
    }
    function ADDimm8(instruction) {
        //Add an 8-bit immediate value with a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = write8OffsetLowRegister(instruction, "parentObj.CPSR.setADDFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function SUBimm8(instruction) {
        //Subtract an 8-bit immediate value from a register:
        var operand1 = read8OffsetLowRegister(instruction);
        var operand2 = instruction & 0xFF;
        var code = write8OffsetLowRegister(instruction, "parentObj.CPSR.setSUBFlags(" + operand1 + " | 0, " + operand2 + ")");
        return Function("parentObj", code);
    }
    function AND(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise AND:
        var code = "var result = " + source + " & " + destination + ";";
        code += "parentObj.CPSR.setNegativeInt(result | 0);";
        code += "parentObj.CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result");
        return Function("parentObj", code);
    }
    function EOR(instruction) {
        var source = read3OffsetLowRegister(instruction);
        var destination = read0OffsetLowRegister(instruction);
        //Perform bitwise EOR:
        var code = "var result = " + source + " ^ " + destination + ";";
        code += "parentObj.CPSR.setNegativeInt(result | 0);";
        code += "parentObj.CPSR.setZeroInt(result | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "result");
        return Function("parentObj", code);
    }
    function LSL(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data left:
                code += "parentObj.CPSR.setCarry((destination << ((source - 1) | 0)) < 0);";
                code += "destination <<= source;";
            code += "}";
            code += "else if (source == 0x20) {";
                //Shift bit 0 into carry:
                code += "parentObj.CPSR.setCarry((destination & 0x1) == 0x1);";
                code += "destination = 0;";
            code += "}";
            code += "else {";
                //Everything Zero'd:
                code += "parentObj.CPSR.setCarryFalse();";
                code += "destination = 0;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(destination | 0);";
        code += "parentObj.CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination");
        return Function("parentObj", code);
    }
    function LSR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data right logically:
                code += "parentObj.CPSR.setCarry(((destination >> ((source - 1) | 0)) & 0x1) == 0x1);";
                code += "destination = (destination >>> source) | 0;";
            code += "}";
            code += "else if (source == 0x20) {";
                //Shift bit 31 into carry:
                code += "parentObj.CPSR.setCarry(destination < 0);";
                code += "destination = 0;";
            code += "}";
            code += "else {";
                //Everything Zero'd:
                code += "parentObj.CPSR.setCarryFalse();";
                code += "destination = 0;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(destination | 0);";
        code += "parentObj.CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination");
        return Function("parentObj", code);
    }
    function ASR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Check to see if we need to update CPSR:
        code += "if (source > 0) {";
            code += "if (source < 0x20) {";
                //Shift the register data right arithmetically:
                code += "parentObj.CPSR.setCarry(((destination >> ((source - 1) | 0)) & 0x1) == 0x1);";
                code += "destination >>= source;";
            code += "}";
            code += "else {";
                //Set all bits with bit 31:
                code += "parentObj.CPSR.setCarry(destination < 0);";
                code += "destination >>= 0x1F;";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(destination | 0);";
        code += "parentObj.CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination");
        return Function("parentObj", code);
    }
    function ADC(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setADCFlags(" + operand1 + " | 0, " + operand2 + " | 0)");
        return Function("parentObj", code);
    }
    function SBC(instruction) {
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        //Update destination register:
        var code = write0OffsetLowRegister(instruction, "parentObj.CPSR.setSBCFlags(" + operand1 + " | 0, " + operand2 + " | 0)");
        return Function("parentObj", code);
    }
    function ROR(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " & 0xFF;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        code += "if (source > 0) {";
            code += "source &= 0x1F;";
            code += "if (source > 0) {";
                //CPSR Carry is set by the last bit shifted out:
                code += "parentObj.CPSR.setCarry(((destination >>> ((source - 1) | 0)) & 0x1) != 0);";
                //Perform rotate:
                code += "destination = (destination << ((0x20 - source) | 0)) | (destination >>> (source | 0));";
            code += "}";
            code += "else {";
                code += "parentObj.CPSR.setCarry(destination < 0);";
            code += "}";
        code += "}";
        //Perform CPSR updates for N and Z (But not V):
        code += "parentObj.CPSR.setNegativeInt(destination | 0);";
        code += "parentObj.CPSR.setZeroInt(destination | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "destination");
        return Function("parentObj", code);
    }
    function TST(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        code += "var destination = " + read0OffsetLowRegister(instruction) + " | 0;";
        //Perform bitwise AND:
        code += "var result = source & destination;";
        code += "parentObj.CPSR.setNegativeInt(result | 0);";
        code += "parentObj.CPSR.setZeroInt(result | 0);";
        return Function("parentObj", code);
    }
    function NEG(instruction) {
        var code = "var source = " + read3OffsetLowRegister(instruction) + " | 0;";
        code += "parentObj.CPSR.setOverflow((source ^ (-(source | 0))) == 0);";
        //Perform Subtraction:
        code += "source = (-(source | 0)) | 0;";
        code += "parentObj.CPSR.setNegativeInt(source | 0);";
        code += "parentObj.CPSR.setZeroInt(source | 0);";
        //Update destination register:
        code += write0OffsetLowRegister(instruction, "source");
        return Function("parentObj", code);
    }
    function CMP(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = "parentObj.CPSR.setCMPFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return Function("parentObj", code);
    }
    function CMN(instruction) {
        //Compare two registers:
        var operand1 = read0OffsetLowRegister(instruction);
        var operand2 = read3OffsetLowRegister(instruction);
        var code = "parentObj.CPSR.setCMNFlags(" + operand1 + " | 0, " + operand2 + " | 0);";
        return Function("parentObj", code);
    }
    function ORR(parentObj) {
        var source = parentObj.read3OffsetLowRegister() | 0;
        var destination = parentObj.read0OffsetLowRegister() | 0;
        //Perform bitwise OR:
        var result = source | destination;
        parentObj.CPSR.setNegativeInt(result | 0);
        parentObj.CPSR.setZeroInt(result | 0);
        //Update destination register:
        parentObj.write0OffsetLowRegister(result | 0);
    }
    function MUL(parentObj) {
        var source = parentObj.read3OffsetLowRegister() | 0;
        var destination = parentObj.read0OffsetLowRegister() | 0;
        //Perform MUL32:
        var result = parentObj.CPUCore.performMUL32(source | 0, destination | 0, 0) | 0;
        parentObj.CPSR.setCarryFalse();
        parentObj.CPSR.setNegativeInt(result | 0);
        parentObj.CPSR.setZeroInt(result | 0);
        //Update destination register:
        parentObj.write0OffsetLowRegister(result | 0);
    }
    function BIC(parentObj) {
        var source = parentObj.read3OffsetLowRegister() | 0;
        var destination = parentObj.read0OffsetLowRegister() | 0;
        //Perform bitwise AND with a bitwise NOT on source:
        var result = (~source) & destination;
        parentObj.CPSR.setNegativeInt(result | 0);
        parentObj.CPSR.setZeroInt(result | 0);
        //Update destination register:
        parentObj.write0OffsetLowRegister(result | 0);
    }
    function MVN(parentObj) {
        //Perform bitwise NOT on source:
        var source = ~parentObj.read3OffsetLowRegister();
        parentObj.CPSR.setNegativeInt(source | 0);
        parentObj.CPSR.setZeroInt(source | 0);
        //Update destination register:
        parentObj.write0OffsetLowRegister(source | 0);
    }
    function ADDH_LL(parentObj) {
        var operand1 = parentObj.read0OffsetLowRegister() | 0;
        var operand2 = parentObj.read3OffsetLowRegister() | 0;
        //Perform Addition:
        //Update destination register:
        parentObj.write0OffsetLowRegister(((operand1 | 0) + (operand2 | 0)) | 0);
    }
    function ADDH_LH(parentObj) {
        var operand1 = parentObj.read0OffsetLowRegister() | 0;
        var operand2 = parentObj.readHighRegister(parentObj.execute >> 3) | 0;
        //Perform Addition:
        //Update destination register:
        parentObj.write0OffsetLowRegister(((operand1 | 0) + (operand2 | 0)) | 0);
    }
    function ADDH_HL(parentObj) {
        var operand1 = parentObj.readHighRegister(parentObj.execute | 0) | 0;
        var operand2 = parentObj.read3OffsetLowRegister() | 0;
        //Perform Addition:
        //Update destination register:
        parentObj.guardHighRegisterWrite(((operand1 | 0) + (operand2 | 0)) | 0);
    }
    function ADDH_HH(parentObj) {
        var operand1 = parentObj.readHighRegister(parentObj.execute | 0) | 0;
        var operand2 = parentObj.readHighRegister(parentObj.execute >> 3) | 0;
        //Perform Addition:
        //Update destination register:
        parentObj.guardHighRegisterWrite(((operand1 | 0) + (operand2 | 0)) | 0);
    }
    function CMPH_LL(parentObj) {
        //Compare two registers:
        var operand1 = parentObj.read0OffsetLowRegister() | 0;
        var operand2 = parentObj.read3OffsetLowRegister() | 0;
        parentObj.CPSR.setCMPFlags(operand1 | 0, operand2 | 0);
    }
    function CMPH_LH(parentObj) {
        //Compare two registers:
        var operand1 = parentObj.read0OffsetLowRegister() | 0;
        var operand2 = parentObj.readHighRegister(parentObj.execute >> 3) | 0;
        parentObj.CPSR.setCMPFlags(operand1 | 0, operand2 | 0);
    }
    function CMPH_HL(parentObj) {
        //Compare two registers:
        var operand1 = parentObj.readHighRegister(parentObj.execute | 0) | 0;
        var operand2 = parentObj.read3OffsetLowRegister() | 0;
        parentObj.CPSR.setCMPFlags(operand1 | 0, operand2 | 0);
    }
    function CMPH_HH(parentObj) {
        //Compare two registers:
        var operand1 = parentObj.readHighRegister(parentObj.execute | 0) | 0;
        var operand2 = parentObj.readHighRegister(parentObj.execute >> 3) | 0;
        parentObj.CPSR.setCMPFlags(operand1 | 0, operand2 | 0);
    }
    function MOVH_LL(parentObj) {
        //Move a register to another register:
        parentObj.write0OffsetLowRegister(parentObj.read3OffsetLowRegister() | 0);
    }
    function MOVH_LH(parentObj) {
        //Move a register to another register:
        parentObj.write0OffsetLowRegister(parentObj.readHighRegister(parentObj.execute >> 3) | 0);
    }
    function MOVH_HL(parentObj) {
        //Move a register to another register:
        parentObj.guardHighRegisterWrite(parentObj.read3OffsetLowRegister() | 0);
    }
    function MOVH_HH(parentObj) {
        //Move a register to another register:
        parentObj.guardHighRegisterWrite(parentObj.readHighRegister(parentObj.execute >> 3) | 0);
    }
    function BX_L(parentObj) {
        //Branch & eXchange:
        var address = parentObj.read3OffsetLowRegister() | 0;
        if ((address & 0x1) == 0) {
            //Enter ARM mode:
            parentObj.CPUCore.enterARM();
            parentObj.CPUCore.branch(address & -0x4);
        }
        else {
            //Stay in THUMB mode:
            parentObj.CPUCore.branch(address & -0x2);
        }
    }
    function BX_H(parentObj) {
        //Branch & eXchange:
        var address = parentObj.readHighRegister(parentObj.execute >> 3) | 0;
        if ((address & 0x1) == 0) {
            //Enter ARM mode:
            parentObj.CPUCore.enterARM();
            parentObj.CPUCore.branch(address & -0x4);
        }
        else {
            //Stay in THUMB mode:
            parentObj.CPUCore.branch(address & -0x2);
        }
    }
    function LDRPC(parentObj) {
        //PC-Relative Load
        var data = parentObj.CPUCore.read32(((parentObj.readPC() & -3) + ((parentObj.execute & 0xFF) << 2)) | 0) | 0;
        parentObj.write8OffsetLowRegister(data | 0);
    }
    function STRreg(parentObj) {
        //Store Word From Register
        var address = ((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write32(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function STRHreg(parentObj) {
        //Store Half-Word From Register
        var address = ((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write16(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function STRBreg(parentObj) {
        //Store Byte From Register
        var address = ((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write8(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function LDRSBreg(parentObj) {
        //Load Signed Byte Into Register
        var data = (parentObj.CPUCore.read8(((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0) << 24) >> 24;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function LDRreg(parentObj) {
        //Load Word Into Register
        var data = parentObj.CPUCore.read32(((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function LDRHreg(parentObj) {
        //Load Half-Word Into Register
        var data = parentObj.CPUCore.read16(((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function LDRBreg(parentObj) {
        //Load Byte Into Register
        var data = parentObj.CPUCore.read8(((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function LDRSHreg(parentObj) {
        //Load Signed Half-Word Into Register
        var data = (parentObj.CPUCore.read16(((parentObj.read6OffsetLowRegister() | 0) + (parentObj.read3OffsetLowRegister() | 0)) | 0) << 16) >> 16;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function STRimm5(parentObj) {
        //Store Word From Register
        var address = (((parentObj.execute >> 4) & 0x7C) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write32(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function LDRimm5(parentObj) {
        //Load Word Into Register
        var data = parentObj.CPUCore.read32((((parentObj.execute >> 4) & 0x7C) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function STRBimm5(parentObj) {
        //Store Byte From Register
        var address = (((parentObj.execute >> 6) & 0x1F) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write8(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function LDRBimm5(parentObj) {
        //Load Byte Into Register
        var data = parentObj.CPUCore.read8((((parentObj.execute >> 6) & 0x1F) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function STRHimm5(parentObj) {
        //Store Half-Word From Register
        var address = (((parentObj.execute >> 5) & 0x3E) + (parentObj.read3OffsetLowRegister() | 0)) | 0;
        parentObj.CPUCore.write16(address | 0, parentObj.read0OffsetLowRegister() | 0);
    }
    function LDRHimm5(parentObj) {
        //Load Half-Word Into Register
        var data = parentObj.CPUCore.read16((((parentObj.execute >> 5) & 0x3E) + (parentObj.read3OffsetLowRegister() | 0)) | 0) | 0;
        parentObj.write0OffsetLowRegister(data | 0);
    }
    function STRSP(parentObj) {
        //Store Word From Register
        var address = (((parentObj.execute & 0xFF) << 2) + (parentObj.readSP() | 0)) | 0;
        parentObj.CPUCore.write32(address | 0, parentObj.read8OffsetLowRegister() | 0);
    }
    function LDRSP(parentObj) {
        //Load Word Into Register
        var data = parentObj.CPUCore.read32((((parentObj.execute & 0xFF) << 2) + (parentObj.readSP() | 0)) | 0) | 0;
        parentObj.write8OffsetLowRegister(data | 0);
    }
    function ADDPC(parentObj) {
        //Add PC With Offset Into Register
        var data = ((parentObj.readPC() & -3) + ((parentObj.execute & 0xFF) << 2)) | 0;
        parentObj.write8OffsetLowRegister(data | 0);
    }
    function ADDSP(parentObj) {
        //Add SP With Offset Into Register
        var data = (((parentObj.execute & 0xFF) << 2) + (parentObj.readSP() | 0)) | 0;
        parentObj.write8OffsetLowRegister(data | 0);
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
        return Function("parentObj", code);
    }
    function PUSH(parentObj) {
        //Only initialize the PUSH sequence if the register list is non-empty:
        if ((parentObj.execute & 0xFF) > 0) {
            //Updating the address bus away from PC fetch:
            parentObj.wait.NonSequentialBroadcast();
            //Push register(s) onto the stack:
            for (var rListPosition = 7; (rListPosition | 0) > -1; rListPosition = ((rListPosition | 0) - 1) | 0) {
                if ((parentObj.execute & (1 << rListPosition)) != 0) {
                    //Push register onto the stack:
                    parentObj.SPDecrementWord();
                    parentObj.stackMemoryCache.memoryWrite32(parentObj.readSP() >>> 0, parentObj.readLowRegister(rListPosition | 0) | 0);
                }
            }
            //Updating the address bus back to PC fetch:
            parentObj.wait.NonSequentialBroadcast();
        }
    }
    function PUSHlr(parentObj) {
        //Updating the address bus away from PC fetch:
        parentObj.wait.NonSequentialBroadcast();
        //Push link register onto the stack:
        parentObj.SPDecrementWord();
        parentObj.stackMemoryCache.memoryWrite32(parentObj.readSP() >>> 0, parentObj.readLR() | 0);
        //Push register(s) onto the stack:
        for (var rListPosition = 7; (rListPosition | 0) > -1; rListPosition = ((rListPosition | 0) - 1) | 0) {
            if ((parentObj.execute & (1 << rListPosition)) != 0) {
                //Push register onto the stack:
                parentObj.SPDecrementWord();
                parentObj.stackMemoryCache.memoryWrite32(parentObj.readSP() >>> 0, parentObj.readLowRegister(rListPosition | 0) | 0);
            }
        }
        //Updating the address bus back to PC fetch:
        parentObj.wait.NonSequentialBroadcast();
    }
    function POP(parentObj) {
        //Only initialize the POP sequence if the register list is non-empty:
        if ((parentObj.execute & 0xFF) > 0) {
            //Updating the address bus away from PC fetch:
            parentObj.wait.NonSequentialBroadcast();
            //POP stack into register(s):
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((parentObj.execute & (1 << rListPosition)) != 0) {
                    //POP stack into a register:
                    parentObj.writeLowRegister(rListPosition | 0, parentObj.stackMemoryCache.memoryRead32(parentObj.readSP() >>> 0) | 0);
                    parentObj.SPIncrementWord();
                }
            }
            //Updating the address bus back to PC fetch:
            parentObj.wait.NonSequentialBroadcast();
        }
    }
    function POPpc(parentObj) {
        //Updating the address bus away from PC fetch:
        parentObj.wait.NonSequentialBroadcast();
        //POP stack into register(s):
        for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
            if ((parentObj.execute & (1 << rListPosition)) != 0) {
                //POP stack into a register:
                parentObj.writeLowRegister(rListPosition | 0, parentObj.stackMemoryCache.memoryRead32(parentObj.readSP() >>> 0) | 0);
                parentObj.SPIncrementWord();
            }
        }
        //POP stack into the program counter (r15):
        //We performed a branch:
        //Update the program counter to branch address:
        parentObj.CPUCore.branch(parentObj.stackMemoryCache.memoryRead32(parentObj.readSP() >>> 0) & -2);
        parentObj.SPIncrementWord();
        //Updating the address bus back to PC fetch:
        parentObj.wait.NonSequentialBroadcast();
    }
    function STMIA(parentObj) {
        //Only initialize the STMIA sequence if the register list is non-empty:
        if ((parentObj.execute & 0xFF) > 0) {
            //Get the base address:
            var currentAddress = parentObj.read8OffsetLowRegister() | 0;
            //Updating the address bus away from PC fetch:
            parentObj.wait.NonSequentialBroadcast();
            //Push register(s) into memory:
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((parentObj.execute & (1 << rListPosition)) != 0) {
                    //Push a register into memory:
                    parentObj.stackMemoryCache.memoryWrite32(currentAddress >>> 0, parentObj.readLowRegister(rListPosition | 0) | 0);
                    currentAddress = ((currentAddress | 0) + 4) | 0;
                }
            }
            //Store the updated base address back into register:
            parentObj.write8OffsetLowRegister(currentAddress | 0);
            //Updating the address bus back to PC fetch:
            parentObj.wait.NonSequentialBroadcast();
        }
    }
    function LDMIA(parentObj) {
        //Only initialize the LDMIA sequence if the register list is non-empty:
        if ((parentObj.execute & 0xFF) > 0) {
            //Get the base address:
            var currentAddress = parentObj.read8OffsetLowRegister() | 0;
            //Updating the address bus away from PC fetch:
            parentObj.wait.NonSequentialBroadcast();
            //Load  register(s) from memory:
            for (var rListPosition = 0; (rListPosition | 0) < 8; rListPosition = ((rListPosition | 0) + 1) | 0) {
                if ((parentObj.execute & (1 << rListPosition)) != 0) {
                    //Load a register from memory:
                    parentObj.writeLowRegister(rListPosition | 0, parentObj.stackMemoryCache.memoryRead32(currentAddress >>> 0) | 0);
                    currentAddress = ((currentAddress | 0) + 4) | 0;
                }
            }
            //Store the updated base address back into register:
            parentObj.write8OffsetLowRegister(currentAddress | 0);
            //Updating the address bus back to PC fetch:
            parentObj.wait.NonSequentialBroadcast();
        }
    }
    function BEQ(parentObj) {
        //Branch if EQual:
        if (parentObj.CPSR.getZero()) {
            parentObj.offsetPC();
        }
    }
    function BNE(parentObj) {
        //Branch if Not Equal:
        if (!parentObj.CPSR.getZero()) {
            parentObj.offsetPC();
        }
    }
    function BCS(parentObj) {
        //Branch if Carry Set:
        if (parentObj.CPSR.getCarry()) {
            parentObj.offsetPC();
        }
    }
    function BCC(parentObj) {
        //Branch if Carry Clear:
        if (!parentObj.CPSR.getCarry()) {
            parentObj.offsetPC();
        }
    }
    function BMI(parentObj) {
        //Branch if Negative Set:
        if (parentObj.CPSR.getNegative()) {
            parentObj.offsetPC();
        }
    }
    function BPL(parentObj) {
        //Branch if Negative Clear:
        if (!parentObj.CPSR.getNegative()) {
            parentObj.offsetPC();
        }
    }
    function BVS(parentObj) {
        //Branch if Overflow Set:
        if (parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function BVC(parentObj) {
        //Branch if Overflow Clear:
        if (!parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function BHI(parentObj) {
        //Branch if Carry & Non-Zero:
        if (parentObj.CPSR.getCarry() && !parentObj.CPSR.getZero()) {
            parentObj.offsetPC();
        }
    }
    function BLS(parentObj) {
        //Branch if Carry Clear or is Zero Set:
        if (!parentObj.CPSR.getCarry() || parentObj.CPSR.getZero()) {
            parentObj.offsetPC();
        }
    }
    function BGE(parentObj) {
        //Branch if Negative equal to Overflow
        if (parentObj.CPSR.getNegative() == parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function BLT(parentObj) {
        //Branch if Negative NOT equal to Overflow
        if (parentObj.CPSR.getNegative() != parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function BGT(parentObj) {
        //Branch if Zero Clear and Negative equal to Overflow
        if (!parentObj.CPSR.getZero() && parentObj.CPSR.getNegative() == parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function BLE(parentObj) {
        //Branch if Zero Set or Negative NOT equal to Overflow
        if (parentObj.CPSR.getZero() || parentObj.CPSR.getNegative() != parentObj.CPSR.getOverflow()) {
            parentObj.offsetPC();
        }
    }
    function SWI(parentObj) {
        //Software Interrupt:
        parentObj.CPUCore.SWI();
    }
    function B(parentObj) {
        //Unconditional Branch:
        //Update the program counter to branch address:
        parentObj.CPUCore.branch(((parentObj.readPC() | 0) + ((parentObj.execute << 21) >> 20)) | 0);
    }
    function BLsetup(parentObj) {
        //Brank with Link (High offset)
        //Update the link register to branch address:
        parentObj.writeLR(((parentObj.readPC() | 0) + (((parentObj.execute & 0x7FF) << 21) >> 9)) | 0);
    }
    function BLoff(parentObj) {
        //Brank with Link (Low offset)
        //Update the link register to branch address:
        parentObj.writeLR(((parentObj.readLR() | 0) + ((parentObj.execute & 0x7FF) << 1)) | 0);
        //Copy LR to PC:
        var oldPC = parentObj.readPC() | 0;
        //Flush Pipeline & Block PC Increment:
        parentObj.CPUCore.branch(parentObj.readLR() & -0x2);
        //Set bit 0 of LR high:
        parentObj.writeLR(((oldPC | 0) - 0x2) | 0x1);
    }
    function UNDEFINED(parentObj) {
        //Undefined Exception:
        parentObj.CPUCore.UNDEFINED();
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
    var adjustedMap = [];
    for (var opcode = 0; opcode < 0x10000; opcode++) {
        if (opcode < 0x4300 || (opcode >= 0xB000 && opcode < 0xB100)) {
            adjustedMap[opcode] = instructionMap[opcode >> 6](opcode);
        }
        else {
            adjustedMap[opcode] = instructionMap[opcode >> 6];
        }
    }
    THUMBInstructionSet.prototype.instructionMap = adjustedMap;
}
compileInstructionMap();