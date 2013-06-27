"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2013 Grant Galitz
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
importScripts(/*"DynarecARMAssemblerCore.js", */"DynarecTHUMBAssemblerCore.js");
self.onmessage = function (command) {
    var info = command.data;
    var startPC = info[0];
    var record = info[1];
    var InTHUMB = info[2];
    var CPUMode = info[3];
    var isROM = info[4];
    var waitstates = info[5];
    try {
        var compiler = new DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM, waitstates);
    }
    catch (error) {
        //Compiler had an internal error, tell the manager about it:
        bailout();
    }
}
function bailout() {
    postMessage([1]);
    self.close();
}
function done(functionString) {
    postMessage([0, functionString]);
    self.close();
}
function DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM, waitstates) {
    this.instructionsToJoin = [];
    this.startPC = startPC;
    this.record = record;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.isROM = isROM;
    this.forceSyncGuard = false;
    if (this.InTHUMB) {
        this.compiler = new DynarecTHUMBAssemblerCore(this, startPC, waitstates);
    }
    else {
        bailout();
        this.compiler = null;
    }
    this.compile();
    this.finish();
}
DynarecCompilerWorkerCore.prototype.compile = function () {
    var length = Math.max(this.record.length - 1, 0);
    for (this.currentRecordOffset = 0; this.currentRecordOffset < length; ++this.currentRecordOffset) {
        this.execute = this.record[this.currentRecordOffset];
        this.decode = this.record[this.currentRecordOffset + 1];
        this.appendCompiledInstruction(this.compiler.generate(this.execute));
    }
}
DynarecCompilerWorkerCore.prototype.appendCompiledInstruction = function (instruction) {
    if (this.forceSyncGuard) {
        //guard reads and writes due to their unknown timing:
        this.spillTiming();
        this.instructionsToJoin.push(instruction);
        this.spillTiming();
        this.forceSyncGuard = false;
    }
    else {
        this.instructionsToJoin.push(instruction);
    }
}
DynarecCompilerWorkerCore.prototype.read16 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM16(" + (address & 0x1FFFFFF) + ") | 0";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[" + (address & 0x3FFFF) + "] | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 1) + "] << 8)";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[" + (address & 0x7FFF) + "] | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 1) + "] << 8)";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[" + address + "] | (this.CPUCore.IOCore.memory.BIOS[" + (address | 1) + "] << 8)";
    }
    else {
        bailout();
    }
}
DynarecCompilerWorkerCore.prototype.read32 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM32(" + (address & 0x1FFFFFF) + ") | 0";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[" + (address & 0x3FFFF) + "] | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 1) + "] << 8) | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 3) + "] << 24)";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[" + (address & 0x7FFF) + "] | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 1) + "] << 8) | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 3) + "] << 24)";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[" + address + "] | (this.CPUCore.IOCore.memory.BIOS[" + (address | 1) + "] << 8) | (this.CPUCore.IOCore.memory.BIOS[" + (address | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.BIOS[" + (address | 3) + "] << 24)";
    }
    else {
        bailout();
    }
}
DynarecCompilerWorkerCore.prototype.addStateMachineUpdate = function () {
    var code = "\t/*State Machine Synchronize*/\n";
    code += "\tcpu.registers[15] = " + this.compiler.getPipelinePC() + " | 0;\n";
    if (this.isROM) {
        code += "\tcpu.instructionHandle.execute = " + this.execute + ";\n";
        code += "\tcpu.instructionHandle.decode = " + this.decode + " | 0;\n";
    }
    else {
        code += "\tcpu.instructionHandle.execute = instruction | 0;\n";
        code += "\tcpu.instructionHandle.decode = " +  this.addMemoryRead(this.compiler.getDecodeOffset()) + " | 0;\n";
    }
    code += "\tcpu.pipelineInvalid = 0;\n";
    code += "\tcpu.IOCore.updateCore(" + this.compiler.clocks + ");\n";
    return code;
}
DynarecCompilerWorkerCore.prototype.bailoutEarly = function () {
    var bailoutText = "\t/*Bailout spew code*/\n";
    bailoutText += this.addStateMachineUpdate();
    bailoutText += "\treturn;\n";
    return bailoutText;
}
DynarecCompilerWorkerCore.prototype.spillTiming = function () {
    var code = this.addClockChecks();
    code += this.instructionsToJoin.join("");
    code += this.addStateMachineUpdate();
    this.instructionsToJoin = [code];
    this.compiler.clocks = 0;
}
DynarecCompilerWorkerCore.prototype.addMemoryRead = function (pc) {
    if (this.InTHUMB) {
        return this.read16(pc);
    }
    else {
        return this.read32(pc);
    }
}
DynarecCompilerWorkerCore.prototype.addRAMGuards = function (instructionValue, instructionCode) {
    if (this.isROM) {
        return instructionCode;
    }
    var guardText = "/*RAM guard check*/\n";
    guardText += "var instruction = " +  this.addMemoryRead(this.compiler.getRealPC()) + ";\n";
    guardText += "if (instruction != " + instructionValue + ") {\n";
    guardText += this.bailoutEarly();
    guardText += "}\n";
    guardText += instructionCode;
    return guardText;
}
DynarecCompilerWorkerCore.prototype.addClockChecks = function () {
    return "if (cpu.IOCore.cyclesUntilNextEvent() < " + this.compiler.clocks + ") {\n\treturn;\n}\n";
}
DynarecCompilerWorkerCore.prototype.finish = function () {
    var code = this.addClockChecks();
    code += this.instructionsToJoin.join("");
    code += this.addStateMachineUpdate();
    done(code);
}