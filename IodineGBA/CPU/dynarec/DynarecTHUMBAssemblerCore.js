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
function DynarecTHUMBAssemblerCore(pc, records) {
    pc = pc >>> 0;
    this.currentPC = pc >>> 0;
    this.startAddress = this.toHex(this.currentPC);
    this.branched = false;
    this.records = records;
    this.compileInstructionMap();
    this.generateSpew();
}
DynarecTHUMBAssemblerCore.prototype.generateSpew = function () {
    var batched = "\t//Stub Code For Address " + this.startAddress + ":\n" +
    "\tvar thumb = cpu.THUMB;\n";
    batched += this.generatePipelineSpew1();
    this.incrementInternalPC();
    batched += this.generatePipelineSpew2();
    this.incrementInternalPC();
    var length = this.records.length - 2;
    for (var index = 0; index < length && !this.branched; index++) {
        batched += this.generateBodySpew(index >>> 0, this.records[index >>> 0] >>> 0);
        this.incrementInternalPC();
    }
    this.stubCode = batched;
}
DynarecTHUMBAssemblerCore.prototype.toHex = function (toConvert) {
    return "0x" + toConvert.toString(16);
}
DynarecTHUMBAssemblerCore.prototype.getStubCode = function () {
    return this.stubCode;
}
DynarecTHUMBAssemblerCore.prototype.incrementInternalPC = function () {
    this.currentPC = this.nextInstructionPC() >>> 0;
}
DynarecTHUMBAssemblerCore.prototype.nextInstructionPC = function () {
    return ((this.currentPC >>> 0) + 2) >>> 0;
}
DynarecTHUMBAssemblerCore.prototype.currentInstructionPC = function () {
    return this.toHex(this.currentPC >>> 0);
}
DynarecTHUMBAssemblerCore.prototype.isInROM = function (relativePC) {
    //Get the address of the instruction:
    var relativePC = relativePC >>> 0;
    //Check for instruction address being in ROM:
    if ((relativePC >>> 0) > 0x8000000) {
        if ((relativePC >>> 0) < 0xE000000) {
            return true;
        }
    }
    else if ((relativePC >>> 0) < 0x4000) {
        return true;
    }
    return false;
}
DynarecTHUMBAssemblerCore.prototype.generatePipelineSpew1 = function () {
    return this.insertRunnableCheck() +
    this.insertFetchPrefix() +
    "\t//Waiting for the pipeline bubble to clear... two stages left\n" +
    "\t//Push fetch to decode:\n" +
    "\tthumb.decode = thumb.fetch | 0;\n" +
	this.incrementPC();
}
DynarecTHUMBAssemblerCore.prototype.generatePipelineSpew2 = function () {
    return this.insertRunnableCheck() +
    this.insertFetchPrefix() +
    "\t//Waiting for the pipeline bubble to clear... one stage left\n" +
    this.insertPipelineStartSuffix() +
	this.incrementPC();
}
DynarecTHUMBAssemblerCore.prototype.generateBodySpew = function (index, instruction) {
    instruction = instruction | 0;
    return this.insertRunnableCheck() +
    this.insertMemoryInstabilityCheck(instruction) +
    ((index == 0) ? this.insertFetchPrefix() : this.insertFetching()) +
    this.generateInstructionSpew(instruction | 0) +
    this.insertPipelineSuffix(index | 0) +
	this.checkPCStatus();
}
DynarecTHUMBAssemblerCore.prototype.generateInstructionSpew = function (instruction) {
    instruction = instruction | 0;
    var instructionID = this.instructionMap[instruction >> 6];
    if (typeof this[instructionID] == "function") {
        //Patch in our own inlined code:
        return this[instructionID](instruction | 0);
    }
    else {
        //Call out to the interpreter's stub:
        return "\tthumb." + this.instructionMap[instruction >> 6] + "(thumb);\n";
    }
}
DynarecTHUMBAssemblerCore.prototype.insertMemoryInstabilityCheck = function (instruction) {
    if (!!this.isInROM(((this.currentPC >>> 0) - 4) >>> 0)) {
        return "\t//Address of instruction located in ROM, skipping guard check!\n";
    }
    else {
        return "\t//Verify the cached instruction should be called:\n" +
        "\tif ((thumb.execute | 0) != " + this.toHex(instruction) + ") {\n" +
            "\t\tcpu.dynarec.findCache(" + this.startAddress + ").bailout();\n" +
            "\t\treturn;\n" +
        "\t}\n";
    }
}
DynarecTHUMBAssemblerCore.prototype.insertRunnableCheck = function () {
    return "\t//Ensure we do not run when an IRQ is flagged or not in cpu mode:\n" +
    "\tif (!!cpu.breakNormalExecution) {\n" +
        //"\t\tcpu.dynarec.findCache(" + this.startAddress + ").tickBad();\n" +
        "\t\treturn;\n" +
	"\t}\n";
}
DynarecTHUMBAssemblerCore.prototype.insertFetchPrefix = function () {
    return this.insertPipelineTick() +
    this.insertFetching();
}
DynarecTHUMBAssemblerCore.prototype.insertPipelineTick = function () {
    return "\t//Tick the CPU pipeline:\n" +
	"\tcpu.pipelineInvalid >>= 1;\n";
}
DynarecTHUMBAssemblerCore.prototype.insertFetching = function () {
    return "\t//Update the fetch stage:\n" +
    "\tthumb.fetch = cpu.wait.CPUGetOpcode16(" + this.currentInstructionPC() + ") | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.insertPipelineStartSuffix = function () {
    return "\t//Push decode to execute and fetch to decode:\n" +
    "\tthumb.execute = thumb.decode | 0;\n" +
    "\tthumb.decode = thumb.fetch | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.insertPipelineSuffix = function (index) {
    return "\t//Push decode to execute and fetch to decode:\n" +
    "\tthumb.execute = " + ((this.isInROM(((this.currentPC >>> 0) - 2) >>> 0)) ? this.toHex(this.records[index + 1]) : "thumb.decode | 0") + ";\n" +
    "\tthumb.decode = " + ((this.isInROM(this.currentPC >>> 0)) ? this.toHex(this.records[index + 2]) : "thumb.fetch | 0") + ";\n";
}
DynarecTHUMBAssemblerCore.prototype.checkPCStatus = function () {
    return "\tif ((cpu.pipelineInvalid | 0) == 0) {\n" +
        "\t" + this.incrementPC() +
	"\t}\n" +
    "\telse {\n" +
        "\t\t//We branched, so exit normally:\n" +
        "\t\treturn;\n" +
	"\t}\n";
}
DynarecTHUMBAssemblerCore.prototype.incrementPC = function () {
    return "\tcpu.registers[15] = " + this.toHex(this.nextInstructionPC()) + ";\n";
}
DynarecTHUMBAssemblerCore.prototype.conditionalInline = function (instructionVariable, instructionSnippet, altSnippet) {
    //Factor out some zero math:
    if (instructionVariable > 0) {
        return instructionSnippet;
    }
    else {
        return altSnippet;
    }
}
DynarecTHUMBAssemblerCore.prototype.compileInstructionMap = function () {
	this.instructionMap = [];
	//0-7
	this.generateLowMap("LSLimm");
	//8-F
	this.generateLowMap("LSRimm");
	//10-17
	this.generateLowMap("ASRimm");
	//18-19
	this.generateLowMap2("ADDreg");
	//1A-1B
	this.generateLowMap2("SUBreg");
	//1C-1D
	this.generateLowMap2("ADDimm3");
	//1E-1F
	this.generateLowMap2("SUBimm3");
	//20-27
	this.generateLowMap("MOVimm8");
	//28-2F
	this.generateLowMap("CMPimm8");
	//30-37
	this.generateLowMap("ADDimm8");
	//38-3F
	this.generateLowMap("SUBimm8");
	//40
	this.generateLowMap4("AND", "EOR", "LSL", "LSR");
	//41
	this.generateLowMap4("ASR", "ADC", "SBC", "ROR");
	//42
	this.generateLowMap4("TST", "NEG", "CMP", "CMN");
	//43
	this.generateLowMap4("ORR", "MUL", "BIC", "MVN");
	//44
	this.generateLowMap4("ADDH_LL", "ADDH_LH", "ADDH_HL", "ADDH_HH");
	//45
	this.generateLowMap4("CMPH_LL", "CMPH_LH", "CMPH_HL", "CMPH_HH");
	//46
	this.generateLowMap4("MOVH_LL", "MOVH_LH", "MOVH_HL", "MOVH_HH");
	//47
	this.generateLowMap4("BX_L", "BX_H", "BX_L", "BX_H");
	//48-4F
	this.generateLowMap("LDRPC");
	//50-51
	this.generateLowMap2("STRreg");
	//52-53
	this.generateLowMap2("STRHreg");
	//54-55
	this.generateLowMap2("STRBreg");
	//56-57
	this.generateLowMap2("LDRSBreg");
	//58-59
	this.generateLowMap2("LDRreg");
	//5A-5B
	this.generateLowMap2("LDRHreg");
	//5C-5D
	this.generateLowMap2("LDRBreg");
	//5E-5F
	this.generateLowMap2("LDRSHreg");
	//60-67
	this.generateLowMap("STRimm5");
	//68-6F
	this.generateLowMap("LDRimm5");
	//70-77
	this.generateLowMap("STRBimm5");
	//78-7F
	this.generateLowMap("LDRBimm5");
	//80-87
	this.generateLowMap("STRHimm5");
	//88-8F
	this.generateLowMap("LDRHimm5");
	//90-97
	this.generateLowMap("STRSP");
	//98-9F
	this.generateLowMap("LDRSP");
	//A0-A7
	this.generateLowMap("ADDPC");
	//A8-AF
	this.generateLowMap("ADDSP");
	//B0
	this.generateLowMap3("ADDSPimm7");
	//B1
	this.generateLowMap3("UNDEFINED");
	//B2
	this.generateLowMap3("UNDEFINED");
	//B3
	this.generateLowMap3("UNDEFINED");
	//B4
	this.generateLowMap3("PUSH");
	//B5
	this.generateLowMap3("PUSHlr");
	//B6
	this.generateLowMap3("UNDEFINED");
	//B7
	this.generateLowMap3("UNDEFINED");
	//B8
	this.generateLowMap3("UNDEFINED");
	//B9
	this.generateLowMap3("UNDEFINED");
	//BA
	this.generateLowMap3("UNDEFINED");
	//BB
	this.generateLowMap3("UNDEFINED");
	//BC
	this.generateLowMap3("POP");
	//BD
	this.generateLowMap3("POPpc");
	//BE
	this.generateLowMap3("UNDEFINED");
	//BF
	this.generateLowMap3("UNDEFINED");
	//C0-C7
	this.generateLowMap("STMIA");
	//C8-CF
	this.generateLowMap("LDMIA");
	//D0
	this.generateLowMap3("BEQ");
	//D1
	this.generateLowMap3("BNE");
	//D2
	this.generateLowMap3("BCS");
	//D3
	this.generateLowMap3("BCC");
	//D4
	this.generateLowMap3("BMI");
	//D5
	this.generateLowMap3("BPL");
	//D6
	this.generateLowMap3("BVS");
	//D7
	this.generateLowMap3("BVC");
	//D8
	this.generateLowMap3("BHI");
	//D9
	this.generateLowMap3("BLS");
	//DA
	this.generateLowMap3("BGE");
	//DB
	this.generateLowMap3("BLT");
	//DC
	this.generateLowMap3("BGT");
	//DD
	this.generateLowMap3("BLE");
	//DE
	this.generateLowMap3("UNDEFINED");
	//DF
	this.generateLowMap3("SWI");
	//E0-E7
	this.generateLowMap("B");
	//E8-EF
	this.generateLowMap("UNDEFINED");
	//F0-F7
	this.generateLowMap("BLsetup");
	//F8-FF
	this.generateLowMap("BLoff");
    //Force length to be ready only:
    Object.defineProperty(this.instructionMap, "length", {writable: false});
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
DynarecTHUMBAssemblerCore.prototype.LSLimm = function (instructionValue) {
	var spew = "\t//LSL imm:\n" +
    "\tvar source = cpu.registers[" + this.toHex((instructionValue >> 3) & 0x7) + "] | 0;\n";
	var offset = (instructionValue >> 6) & 0x1F;
	if (offset > 0) {
		spew += "\t//CPSR Carry is set by the last bit shifted out:\n" +
		"\tcpu.CPSRCarry = (" + this.conditionalInline(offset - 1, "(source << " + this.toHex(offset - 1) + ")", "source") + " < 0);\n" +
		"\t//Perform shift:\n" + 
		"\tsource <<= " + this.toHex(offset) + ";\n";
	}
	spew += "\t//Perform CPSR updates for N and Z (But not V):\n" +
	"\tcpu.CPSRNegative = (source < 0);\n" +
	"\tcpu.CPSRZero = (source == 0);\n" +
	"\t//Update destination register:\n" +
	"\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = source | 0;\n";
    return spew;
}
DynarecTHUMBAssemblerCore.prototype.LSRimm = function (instructionValue) {
	var spew = "\t//LSR imm:\n" +
    "\tvar source = cpu.registers[" + this.toHex((instructionValue >> 3) & 0x7) + "] | 0;\n";
	var offset = (instructionValue >> 6) & 0x1F;
	if (offset > 0) {
		spew += "\t//CPSR Carry is set by the last bit shifted out:\n" +
		"\tcpu.CPSRCarry = ((" + this.conditionalInline(offset - 1, "(source >> " + this.toHex(offset - 1) + ")", "source") + " & 0x1) != 0);\n" +
		"\t//Perform shift:\n" +
		"\tsource = (source >>> " + this.toHex(offset) + ") | 0;\n" +
        "//Perform CPSR updates for N and Z (But not V):\n" +
        "\tcpu.CPSRNegative = (source < 0);\n" +
        "\tcpu.CPSRZero = (source == 0);\n" +
        "\t//Update destination register:\n" +
        "\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = source | 0;\n";
	}
    else {
        spew += "\tcpu.CPSRCarry = (source < 0);\n" +
        "\t//Perform CPSR updates for N and Z (But not V):\n" +
        "\tcpu.CPSRNegative = false;\n" +
        "\tcpu.CPSRZero = true;\n" +
        "\t//Update destination register:\n" +
        "\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = 0;\n";
    }
    return spew;
}
DynarecTHUMBAssemblerCore.prototype.ASRimm = function (instructionValue) {
	var spew = "\t//ASR imm:\n" +
    "\tvar source = cpu.registers[" + this.toHex((instructionValue >> 3) & 0x7) + "] | 0;\n";
	var offset = (instructionValue >> 6) & 0x1F;
	if (offset > 0) {
		spew += "\t//CPSR Carry is set by the last bit shifted out:\n" +
		"\tcpu.CPSRCarry = ((" + this.conditionalInline(offset - 1, "(source >> " + this.toHex(offset - 1) + ")", "source") + " & 0x1) != 0);\n" +
		"\t//Perform shift:\n" +
		"\tsource >>= " + this.toHex(offset) + ";\n";
	}
    else {
        spew += "\tcpu.CPSRCarry = (source < 0);\n" +
        "\tsource >>= 0x1F;\n";
    }
	spew += "\t//Perform CPSR updates for N and Z (But not V):\n" +
	"\tcpu.CPSRNegative = (source < 0);\n" +
	"\tcpu.CPSRZero = (source == 0);\n" +
	"\t//Update destination register:\n" +
	"\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = source | 0;\n";
    return spew;
}
DynarecTHUMBAssemblerCore.prototype.ADDreg = function (instructionValue) {
	var spew = "\t//ADD reg:\n" +
    "\tvar operand1 = cpu.registers[" + this.toHex((instructionValue >> 3) & 0x7) + "] | 0;\n" +
	"\tvar operand2 = cpu.registers[" + this.toHex((instructionValue >> 6) & 0x7) + "] | 0;\n" +
	"\t//Update destination register:\n" +
	"\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = cpu.setADDFlags(operand1 | 0, operand2 | 0) | 0;\n";
    return spew;
}
DynarecTHUMBAssemblerCore.prototype.SUBreg = function (instructionValue) {
	var spew = "\t//SUB reg:\n" +
    "\tvar operand1 = cpu.registers[" + this.toHex((instructionValue >> 3) & 0x7) + "] | 0;\n" +
	"\tvar operand2 = cpu.registers[" + this.toHex((instructionValue >> 6) & 0x7) + "] | 0;\n" +
	"\t//Update destination register:\n" +
	"\tcpu.registers[" + this.toHex(instructionValue & 0x7) + "] = cpu.setSUBFlags(operand1 | 0, operand2 | 0) | 0;\n";
    return spew;
}