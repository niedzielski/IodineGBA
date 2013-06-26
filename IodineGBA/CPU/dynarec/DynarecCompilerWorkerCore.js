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
    //try {
        var compiler = new DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM);
    /*}
    catch (error) {
        //Compiler had an internal error, tell the manager about it:
        bailout();
    }*/
}
function bailout() {
    postMessage([1]);
    self.close();
}
function done(functionString) {
    postMessage([0, functionString]);
    self.close();
}
function DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM) {
    this.instructionsToJoin = [];
    this.pc = startPC | 0;
    this.record = record;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.isROM = isROM;
    this.thumbAssembler = new DynarecTHUMBAssemblerCore(this, this.pc);
    this.armAssembler = null;//new DynarecARMAssemblerCore(this, this.pc);
    this.compile();
    this.finish();
}
DynarecCompilerWorkerCore.prototype.compile = function () {
    this.compiler = (this.InTHUMB) ? this.thumbAssembler : this.armAssembler;
    var length = this.record.length;
    for (var index = 0; index < length; ++index) {
        this.instructionsToJoin.push(this.parseInstruction(this.record[index]));
    }
}
DynarecCompilerWorkerCore.prototype.parseInstruction = function (instructionValue) {
    var currentPC = this.compiler.pc;
    var instuctionCode = this.compiler.generate(instructionValue);
    return this.addRAMGuards(instructionValue, instuctionCode, currentPC);
}
DynarecCompilerWorkerCore.prototype.read16 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM16(0x" + (address & 0x1FFFFFF).toString(16) + ");";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[0x" + (address & 0x3FFFF).toString(16) + "] | (this.CPUCore.IOCore.memory.externalRAM[0x" + ((address & 0x3FFFF) | 1).toString(16) + "] << 8);";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[0x" + (address & 0x7FFF).toString(16) + "] | (this.CPUCore.IOCore.memory.internalRAM[0x" + ((address & 0x7FFF) | 1).toString(16) + "] << 8);";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[0x" + (address).toString(16) + "] | (this.CPUCore.IOCore.memory.BIOS[0x" + (address | 1).toString(16) + "] << 8);";
    }
    else {
        bailout();
    }
}
DynarecCompilerWorkerCore.prototype.read32 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM32(0x" + (address & 0x1FFFFFF).toString(16) + ");";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[0x" + (address & 0x3FFFF).toString(16) + "] | (this.CPUCore.IOCore.memory.externalRAM[0x" + ((address & 0x3FFFF) | 1).toString(16) + "] << 8) | (this.CPUCore.IOCore.memory.externalRAM[0x" + ((address & 0x3FFFF) | 2).toString(16) + "] << 16)  | (this.CPUCore.IOCore.memory.externalRAM[0x" + ((address & 0x3FFFF) | 3).toString(16) + "] << 24);";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[0x" + (address & 0x7FFF).toString(16) + "] | (this.CPUCore.IOCore.memory.internalRAM[0x" + ((address & 0x7FFF).toString(16) | 1) + "] << 8) | (this.CPUCore.IOCore.memory.internalRAM[0x" + ((address & 0x7FFF) | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.internalRAM[0x" + ((address & 0x7FFF) | 3).toString(16) + "] << 24);";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[0x" + (address).toString(16) + "] | (this.CPUCore.IOCore.memory.BIOS[0x" + (address | 1).toString(16) + "] << 8) | (this.CPUCore.IOCore.memory.BIOS[0x" + (address | 2).toString(16) + "] << 16)  | (this.CPUCore.IOCore.memory.BIOS[0x" + (address | 3).toString(16) + "] << 24);";
    }
    else {
        bailout();
    }
}
DynarecCompilerWorkerCore.prototype.addMemoryRead = function (pc) {
    if (this.InTHUMB) {
        return this.read16(pc);
    }
    else {
        return this.read32(pc);
    }
}
DynarecCompilerWorkerCore.prototype.bailoutEarly = function (pc) {
    var bailoutText = this.addStateMachineUpdate(pc);
    bailoutText += "return;";
    return bailoutText;
}
DynarecCompilerWorkerCore.prototype.addRAMGuards = function (instructionValue, instructionCode, pc) {
    if (this.isROM) {
        return instructionCode;
    }
    var guardText = "var instruction = " +  this.addMemoryRead(pc) + ";";
    guardText += "if (instruction != 0x" + instructionValue.toString(16) + ") {";
    guardText += this.bailoutEarly(pc);
    guardText += "}";
    guardText += instructionCode;
    return guardText;
}
DynarecCompilerWorkerCore.prototype.addClockChecks = function () {
    return "if (cpu.IOCore.cyclesUntilNextEvent() < " + this.compiler.clocks + ") { return; }";
}
DynarecCompilerWorkerCore.prototype.addStateMachineUpdate = function (pc) {
    var code = ";cpu.registers[15] = 0x" + pc.toString(16) + ";";
    code += "cpu.IOCore.updateCore(" + this.compiler.clocks + ");";
    return code;
}
DynarecCompilerWorkerCore.prototype.finish = function () {
    var code = this.addClockChecks();
    code += this.instructionsToJoin.join(";");
    code += this.addStateMachineUpdate(this.compiler.pc);
    done(code);
}