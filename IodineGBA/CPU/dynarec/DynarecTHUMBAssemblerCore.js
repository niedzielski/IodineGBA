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
    this.pcRaw = pc >>> 0;
    this.pc = "0x" + this.pcRaw.toString(16);
    this.records = records;
    this.compileInstructionMap();
    this.generateSpew();
}
DynarecTHUMBAssemblerCore.prototype.generateSpew = function () {
    var batched = "\t//Stub Code For Address " + this.pc + ":\n" +
    "\tvar thumb = cpu.THUMB;\n";
    batched += this.generatePipelineSpew();
    this.incrementInternalPC();
    batched += this.generatePipelineSpew();
    this.incrementInternalPC();
    var length = this.records.length;
    for (var index = 0; index < length; index++) {
        batched += this.generateBodySpew(index >>> 0, this.records[index >>> 0] >>> 0);
        this.incrementInternalPC();
    }
    this.stubCode = batched;
}
DynarecTHUMBAssemblerCore.prototype.getStubCode = function () {
    return this.stubCode;
}
DynarecTHUMBAssemblerCore.prototype.incrementInternalPC = function () {
    this.pcRaw = this.nextInstructionPC() >>> 0;
}
DynarecTHUMBAssemblerCore.prototype.nextInstructionPC = function () {
    return ((this.pcRaw >>> 0) + 2) >>> 0;
}
DynarecTHUMBAssemblerCore.prototype.currentInstructionPC = function () {
    return ("0x" + (this.pcRaw >>> 0).toString(16));
}
DynarecTHUMBAssemblerCore.prototype.isInROM = function () {
    //Get the address of the instruction:
    var relativePC = ((this.pcRaw >>> 0) - 4) >>> 0;
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
DynarecTHUMBAssemblerCore.prototype.generatePipelineSpew = function () {
    return this.insertRunnableCheck() +
    this.insertFetchPrefix() +
    "\t//Waiting for the pipeline bubble to clear...\n" +
    this.insertPipelineSuffix() +
	this.incrementPC();
}
DynarecTHUMBAssemblerCore.prototype.generateBodySpew = function (index, instruction) {
    instruction = instruction | 0;
    return this.insertRunnableCheck() +
    this.insertMemoryInstabilityCheck(instruction) +
    ((index == 0) ? this.insertFetchPrefix() : this.insertFetching()) +
    this.generateInstructionSpew(instruction | 0) +
    this.insertPipelineSuffix() +
	this.checkPCStatus();
}
DynarecTHUMBAssemblerCore.prototype.generateInstructionSpew = function (instruction) {
    instruction = instruction | 0;
    return "\tthumb." + this.instructionMap[instruction >> 6] + "(thumb);\n";
}
DynarecTHUMBAssemblerCore.prototype.insertMemoryInstabilityCheck = function (instruction) {
    if (!!this.isInROM()) {
        return "\t//Address of instruction located in ROM, skipping guard check!\n";
    }
    else {
        return "\t//Verify the cached instruction should be called:\n" +
        "\tif ((thumb.execute | 0) != 0x" + instruction.toString(16) + ") {\n" +
            "\t\tcpu.dynarec.findCache(" + this.pc + ").bailout();\n" +
            "\t\treturn;\n" +
        "\t}\n";
    }
}
DynarecTHUMBAssemblerCore.prototype.insertRunnableCheck = function () {
    return "\t//Ensure we do not run when an IRQ is flagged or not in cpu mode:\n" +
    "\tif (!!cpu.breakNormalExecution) {\n" +
    this.insertIRQCheck() +
    "\t\tcpu.dynarec.findCache(" + this.pc + ").tickBad();\n" +
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
DynarecTHUMBAssemblerCore.prototype.insertPipelineSuffix = function () {
    return "\t//Push decode to execute and fetch to decode:\n" +
    "\tthumb.execute = thumb.decode | 0;\n" +
    "\tthumb.decode = thumb.fetch | 0;\n";
}
DynarecTHUMBAssemblerCore.prototype.insertIRQCheck = function () {
    return "\t\tcpu.checkPendingIRQ();\n";
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
    return "\tcpu.registers[15] = 0x" + this.nextInstructionPC().toString(16) + ";\n";
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