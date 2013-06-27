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
function DynarecTHUMBAssemblerCore(dynarec, pc, waitstates) {
    this.dynarec = dynarec;
    this.clocks = 0;
    this.pc = pc;
    this.pipelineInvalid = 0x4;
    this.WRAMWaitState = waitstates[0];
	this.SRAMWaitState = waitstates[1];
	this.CARTWaitState0First = waitstates[2];
	this.CARTWaitState0Second = waitstates[3];
	this.CARTWaitState1First = waitstates[4];
	this.CARTWaitState1Second = waitstates[5];
	this.CARTWaitState2First = waitstates[6];
	this.CARTWaitState2Second = waitstates[7];
    this.compileInstructionMap();
}
DynarecTHUMBAssemblerCore.prototype.addInstructionReadClocks = function () {
    this.clocks += 1;
}
DynarecTHUMBAssemblerCore.prototype.generate = function (execute) {
    var codeBlock = this.instructionMap[execute >> 6](this, execute);
    codeBlock = this.dynarec.addRAMGuards(execute, codeBlock);
    codeBlock += this.incrementPC();
    return codeBlock;
}
DynarecTHUMBAssemblerCore.prototype.incrementPC = function () {
    this.pc = (this.pc + 2) | 0;
    this.pipelineInvalid >>= 1;
    return "/*PC Incremented to: " + this.getPipelinePC() + "*/\n";
}
DynarecTHUMBAssemblerCore.prototype.getRealPC = function () {
    return this.pc | 0;
}
DynarecTHUMBAssemblerCore.prototype.getDecodeOffset = function () {
    return (this.pc + 2) | 0;
}
DynarecTHUMBAssemblerCore.prototype.getPipelinePC = function () {
    return (this.pc + 4) | 0;
}
DynarecTHUMBAssemblerCore.prototype.synchronizePC = function () {
    return "cpu.registers[15] = " + this.getPipelinePC() + ";\n";
}
DynarecTHUMBAssemblerCore.prototype.get5BitImmediate = function (execute, shift) {
    return ((execute >> shift) & 0x1F);
}
DynarecTHUMBAssemblerCore.prototype.get3BitImmediate = function (execute, shift) {
    return ((execute >> shift) & 0x7);
}
DynarecTHUMBAssemblerCore.prototype.snip = function () {
    if (this.pc == this.dynarec.startPC) {
        //Force blacklist bail if bailing on the first generated instruction:
        bailout();
    }
    return this.dynarec.bailoutEarly(this.pc);
}
DynarecTHUMBAssemblerCore.prototype.LSLimm = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var offset = " + parentObj.get5BitImmediate(execute, 6) + ";\n" +
	"if (offset > 0) {\n" +
	"	cpu.CPSRCarry = ((source << (offset - 1)) < 0);\n" +
	"	source <<= offset;\n" +
	"}\n" +
	"cpu.CPSRNegative = (source < 0);\n" +
	"cpu.CPSRZero = (source == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = source | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.LSRimm = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var offset = " + parentObj.get5BitImmediate(execute, 6) + ";\n" +
	"if (offset > 0) {\n" +
	"	cpu.CPSRCarry = (((source >> (offset - 1)) & 0x1) != 0);\n" +
	"	source = (source >>> offset) | 0;\n" +
	"}\n" +
    "else {\n" +
    "    cpu.CPSRCarry = (source < 0);\n" +
    "    source = 0;\n" +
    "}\n" +
	"cpu.CPSRNegative = (source < 0);\n" +
	"cpu.CPSRZero = (source == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = source | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ASRimm = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var offset = " + parentObj.get5BitImmediate(execute, 6) + ";\n" +
	"if (offset > 0) {\n" +
	"	cpu.CPSRCarry = (((source >> (offset - 1)) & 0x1) != 0);\n" +
	"	source >>= offset;\n" +
	"}\n" +
    "else {\n" +
    "    cpu.CPSRCarry = (source < 0);\n" +
    "    source >>= 0x1F;\n" +
    "}\n" +
	"cpu.CPSRNegative = (source < 0);\n" +
	"cpu.CPSRZero = (source == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = source | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDreg = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 6) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setADDFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.SUBreg = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 6) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setSUBFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDimm3 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var operand2 = " + parentObj.get3BitImmediate(execute, 6) + ";\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setADDFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.SUBimm3 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var operand2 = " + parentObj.get3BitImmediate(execute, 6) + ";\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setSUBFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MOVimm8 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var result = " + (execute & 0xFF) + ";\n" +
	"cpu.CPSRNegative = false;\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.CMPimm8 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] | 0;\n" +
	"var operand2 = " + (execute & 0xFF) + ";\n" +
	"cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDimm8 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] | 0;\n" +
	"var operand2 = " + (execute & 0xFF) + ";\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] = cpu.setADDFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.SUBimm8 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] | 0;\n" +
	"var operand2 = " + (execute & 0xFF) + ";\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] = cpu.setSUBFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.AND = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = source & destination;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.EOR = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = source ^ destination;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.LSL = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] & 0xFF;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
    "if (source > 0) {\n" +
    "    if (source < 32) {\n" +
    "        cpu.CPSRCarry = ((destination << (source - 1)) < 0);\n" +
    "        destination <<= source;\n" +
    "    }\n" +
    "    else if (source == 32) {\n" +
    "        cpu.CPSRCarry = ((destination & 0x1) == 0x1);\n" +
    "        destination = 0;\n" +
    "    }\n" +
    "    else {\n" +
    "        cpu.CPSRCarry = false;\n" +
    "        destination = 0;\n" +
    "    }\n" +
    "}\n" +
	"cpu.CPSRNegative = (destination < 0);\n" +
	"cpu.CPSRZero = (destination == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = destination | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.LSR = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] & 0xFF;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"if (source > 0) {\n" +
    "    if (source < 32) {\n" +
    "        cpu.CPSRCarry = (((destination >> (source - 1)) & 0x1) == 0x1);\n" +
    "        destination = (destination >>> source) | 0;\n" +
    "    }\n" +
    "    else if (source == 32) {\n" +
    "        cpu.CPSRCarry = (destination < 0);\n" +
    "        destination = 0;\n" +
    "    }\n" +
    "    else {\n" +
    "        cpu.CPSRCarry = false;\n" +
    "        destination = 0;\n" +
    "    }\n" +
    "}\n" +
	"cpu.CPSRNegative = (destination < 0);\n" +
	"cpu.CPSRZero = (destination == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = destination | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ASR = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] & 0xFF;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"if (source > 0) {\n" +
	"	if (source < 0x20) {\n" +
	"		cpu.CPSRCarry = (((destination >> (source - 1)) & 0x1) == 0x1);\n" +
	"		destination >>= source;\n" +
	"	}\n" +
	"	else {\n" +
    "        cpu.CPSRCarry = (destination < 0);\n" +
    "        destination >>= 0x1F;\n" +
	"	}\n" +
    "}\n" +
	"cpu.CPSRNegative = (destination < 0);\n" +
	"cpu.CPSRZero = (destination == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = destination | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADC = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setADCFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.SBC = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.setSBCFlags(operand1 | 0, operand2 | 0) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ROR = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] & 0xFF;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"if (source > 0) {\n" +
    "    source &= 0x1F;\n" +
    "    if (source > 0) {\n" +
    "        cpu.CPSRCarry = (((destination >>> (source - 1)) & 0x1) != 0);\n" +
    "        destination = (destination << (0x20 - source)) | (destination >>> source);\n" +
    "    }\n" +
    "    else {\n" +
    "        cpu.CPSRCarry = (destination < 0);\n" +
    "    }\n" +
    "}\n" +
	"cpu.CPSRNegative = (destination < 0);\n" +
	"cpu.CPSRZero = (destination == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = destination | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.TST = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = source & destination;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.NEG = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.CPSROverflow = ((source ^ (-source)) == 0);\n" +
	"source = (-source) | 0;\n" +
	"cpu.CPSRNegative = (source < 0);\n" +
	"cpu.CPSRZero = (source == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = source | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.CMP = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.CMN = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.setCMNFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.ORR = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = source | destination;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MUL = function (parentObj, execute) {
	return this.snip();
    parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = cpu.performMUL32(source | 0, destination | 0, 0);\n" +
	"cpu.CPSRCarry = false;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.BIC = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var result = (~source) & destination;\n" +
	"cpu.CPSRNegative = (result < 0);\n" +
	"cpu.CPSRZero = (result == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = result | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MVN = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = ~cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.CPSRNegative = (source < 0);\n" +
	"cpu.CPSRZero = (source == 0);\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = source | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDH_LL = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = (source + destination) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDH_LH = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var source = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n" +
	"var destination = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = (source + destination) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDH_HL = function (parentObj, execute) {
	return this.snip();
    parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var source = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"var destination = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] | 0;\n" +
	"cpu.THUMB.guardHighRegisterWrite((source + destination) | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDH_HH = function (parentObj, execute) {
	return this.snip();
    parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var source = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n" +
	"var destination = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] | 0;\n" +
	"cpu.THUMB.guardHighRegisterWrite((source + destination) | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.CMPH_LL = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.CMPH_LH = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var operand1 = cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n" +
	"cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.CMPH_HL = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var operand1 = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n" +
	"cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.CMPH_HH = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "var operand1 = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] | 0;\n" +
	"var operand2 = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n" +
    "cpu.setCMPFlags(operand1 | 0, operand2 | 0);\n";
}
DynarecTHUMBAssemblerCore.prototype.MOVH_LL = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MOVH_LH = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "cpu.registers[" + parentObj.get3BitImmediate(execute, 0) + "] = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MOVH_HL = function (parentObj, execute) {
    parentObj.addInstructionReadClocks();
    return "cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] = cpu.registers[" + parentObj.get3BitImmediate(execute, 3) + "] | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.MOVH_HH = function (parentObj, execute) {
    parentObj.addInstructionReadClocks();
    var code = parentObj.synchronizePC();
    return code + "cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 0)) + "] = cpu.registers[" + (0x8 | parentObj.get3BitImmediate(execute, 3)) + "] | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.BX_L = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BX_H = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRPC = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRHreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRBreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRSBreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRHreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRBreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRSHreg = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRBimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRBimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRHimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRHimm5 = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STRSP = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.LDRSP = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.ADDPC = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] = (" + (parentObj.getPipelinePC() & -3) + " + " + ((execute & 0xFF) << 2) + ") | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDSP = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    return "cpu.registers[" + parentObj.get3BitImmediate(execute, 8) + "] = (" + ((execute & 0xFF) << 2) + " + (cpu.registers[13] | 0)) | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.ADDSPimm7 = function (parentObj, execute) {
	parentObj.addInstructionReadClocks();
    if ((execute & 0x80) != 0) {
		return "cpu.registers[13] = ((cpu.registers[13] | 0) - " + ((execute & 0x7F) << 2) + ") | 0;\n";
	}
	else {
		return "cpu.registers[13] = ((cpu.registers[13] | 0) + " + ((execute & 0x7F) << 2) + ") | 0;\n";
	}
}
DynarecTHUMBAssemblerCore.prototype.PUSH = function (parentObj, execute) {
	if ((execute & 0xFF) > 0) {
		return parentObj.snip();
	}
    parentObj.addInstructionReadClocks();
    return "";
}
DynarecTHUMBAssemblerCore.prototype.PUSHlr = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.POP = function (parentObj, execute) {
	if ((execute & 0xFF) > 0) {
		return parentObj.snip();
	}
    parentObj.addInstructionReadClocks();
    return "";
}
DynarecTHUMBAssemblerCore.prototype.POPpc = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.STMIA = function (parentObj, execute) {
	if ((execute & 0xFF) > 0) {
		return parentObj.snip();
	}
    parentObj.addInstructionReadClocks();
    return "";
}
DynarecTHUMBAssemblerCore.prototype.LDMIA = function (parentObj, execute) {
	if ((execute & 0xFF) > 0) {
		return parentObj.snip();
	}
    parentObj.addInstructionReadClocks();
    return "";
}
DynarecTHUMBAssemblerCore.prototype.BEQ = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BNE = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BCS = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BCC = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BMI = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BPL = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BVS = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BVC = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BHI = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BLS = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BGE = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BLT = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BGT = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BLE = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.SWI = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.B = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BLsetup = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.BLoff = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.UNDEFINED = function (parentObj, execute) {
	return parentObj.snip();
}
DynarecTHUMBAssemblerCore.prototype.compileInstructionMap = function () {
	this.instructionMap = [];
	//0-7
	this.generateLowMap(this.LSLimm);
	//8-F
	this.generateLowMap(this.LSRimm);
	//10-17
	this.generateLowMap(this.ASRimm);
	//18-19
	this.generateLowMap2(this.ADDreg);
	//1A-1B
	this.generateLowMap2(this.SUBreg);
	//1C-1D
	this.generateLowMap2(this.ADDimm3);
	//1E-1F
	this.generateLowMap2(this.SUBimm3);
	//20-27
	this.generateLowMap(this.MOVimm8);
	//28-2F
	this.generateLowMap(this.CMPimm8);
	//30-37
	this.generateLowMap(this.ADDimm8);
	//38-3F
	this.generateLowMap(this.SUBimm8);
	//40
	this.generateLowMap4(this.AND, this.EOR, this.LSL, this.LSR);
	//41
	this.generateLowMap4(this.ASR, this.ADC, this.SBC, this.ROR);
	//42
	this.generateLowMap4(this.TST, this.NEG, this.CMP, this.CMN);
	//43
	this.generateLowMap4(this.ORR, this.MUL, this.BIC, this.MVN);
	//44
	this.generateLowMap4(this.ADDH_LL, this.ADDH_LH, this.ADDH_HL, this.ADDH_HH);
	//45
	this.generateLowMap4(this.CMPH_LL, this.CMPH_LH, this.CMPH_HL, this.CMPH_HH);
	//46
	this.generateLowMap4(this.MOVH_LL, this.MOVH_LH, this.MOVH_HL, this.MOVH_HH);
	//47
	this.generateLowMap4(this.BX_L, this.BX_H, this.BX_L, this.BX_H);
	//48-4F
	this.generateLowMap(this.LDRPC);
	//50-51
	this.generateLowMap2(this.STRreg);
	//52-53
	this.generateLowMap2(this.STRHreg);
	//54-55
	this.generateLowMap2(this.STRBreg);
	//56-57
	this.generateLowMap2(this.LDRSBreg);
	//58-59
	this.generateLowMap2(this.LDRreg);
	//5A-5B
	this.generateLowMap2(this.LDRHreg);
	//5C-5D
	this.generateLowMap2(this.LDRBreg);
	//5E-5F
	this.generateLowMap2(this.LDRSHreg);
	//60-67
	this.generateLowMap(this.STRimm5);
	//68-6F
	this.generateLowMap(this.LDRimm5);
	//70-77
	this.generateLowMap(this.STRBimm5);
	//78-7F
	this.generateLowMap(this.LDRBimm5);
	//80-87
	this.generateLowMap(this.STRHimm5);
	//88-8F
	this.generateLowMap(this.LDRHimm5);
	//90-97
	this.generateLowMap(this.STRSP);
	//98-9F
	this.generateLowMap(this.LDRSP);
	//A0-A7
	this.generateLowMap(this.ADDPC);
	//A8-AF
	this.generateLowMap(this.ADDSP);
	//B0
	this.generateLowMap3(this.ADDSPimm7);
	//B1
	this.generateLowMap3(this.UNDEFINED);
	//B2
	this.generateLowMap3(this.UNDEFINED);
	//B3
	this.generateLowMap3(this.UNDEFINED);
	//B4
	this.generateLowMap3(this.PUSH);
	//B5
	this.generateLowMap3(this.PUSHlr);
	//B6
	this.generateLowMap3(this.UNDEFINED);
	//B7
	this.generateLowMap3(this.UNDEFINED);
	//B8
	this.generateLowMap3(this.UNDEFINED);
	//B9
	this.generateLowMap3(this.UNDEFINED);
	//BA
	this.generateLowMap3(this.UNDEFINED);
	//BB
	this.generateLowMap3(this.UNDEFINED);
	//BC
	this.generateLowMap3(this.POP);
	//BD
	this.generateLowMap3(this.POPpc);
	//BE
	this.generateLowMap3(this.UNDEFINED);
	//BF
	this.generateLowMap3(this.UNDEFINED);
	//C0-C7
	this.generateLowMap(this.STMIA);
	//C8-CF
	this.generateLowMap(this.LDMIA);
	//D0
	this.generateLowMap3(this.BEQ);
	//D1
	this.generateLowMap3(this.BNE);
	//D2
	this.generateLowMap3(this.BCS);
	//D3
	this.generateLowMap3(this.BCC);
	//D4
	this.generateLowMap3(this.BMI);
	//D5
	this.generateLowMap3(this.BPL);
	//D6
	this.generateLowMap3(this.BVS);
	//D7
	this.generateLowMap3(this.BVC);
	//D8
	this.generateLowMap3(this.BHI);
	//D9
	this.generateLowMap3(this.BLS);
	//DA
	this.generateLowMap3(this.BGE);
	//DB
	this.generateLowMap3(this.BLT);
	//DC
	this.generateLowMap3(this.BGT);
	//DD
	this.generateLowMap3(this.BLE);
	//DE
	this.generateLowMap3(this.UNDEFINED);
	//DF
	this.generateLowMap3(this.SWI);
	//E0-E7
	this.generateLowMap(this.B);
	//E8-EF
	this.generateLowMap(this.UNDEFINED);
	//F0-F7
	this.generateLowMap(this.BLsetup);
	//F8-FF
	this.generateLowMap(this.BLoff);
}
DynarecTHUMBAssemblerCore.prototype.generateLowMap = function (instruction) {
    for (var index = 0; index < 0x20; ++index) {
		this.instructionMap.push(instruction);
	}
}
DynarecTHUMBAssemblerCore.prototype.generateLowMap2 = function (instruction) {
    for (var index = 0; index < 0x8; ++index) {
		this.instructionMap.push(instruction);
	}
}
DynarecTHUMBAssemblerCore.prototype.generateLowMap3 = function (instruction) {
    for (var index = 0; index < 0x4; ++index) {
		this.instructionMap.push(instruction);
	}
}
DynarecTHUMBAssemblerCore.prototype.generateLowMap4 = function (instruction1, instruction2, instruction3, instruction4) {
    this.instructionMap.push(instruction1);
	this.instructionMap.push(instruction2);
	this.instructionMap.push(instruction3);
	this.instructionMap.push(instruction4);
}