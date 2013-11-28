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
function GameBoyAdvanceEEPROMChip() {
    this.saves = null;
    this.largestSizePossible = 0x200;
    this.mode = 0;
    this.bitsProcessed = 0;
    this.readAddress = 0;
    this.buffer = getUint8Array(8);
}
GameBoyAdvanceEEPROMChip.prototype.initialize = function () {
    this.allocate();
}
GameBoyAdvanceEEPROMChip.prototype.allocate = function () {
    if (this.saves == null || (this.saves.length | 0) < (this.largestSizePossible | 0)) {
        //Allocate the new array:
        var newSave = getUint8Array(this.largestSizePossible | 0);
        //Init to default value:
        for (var index = 0; (index | 0) < (this.largestSizePossible | 0); index = ((index | 0) + 1) | 0) {
            newSave[index | 0] = 0xFF;
        }
        //Copy the old save data out:
        if (this.saves != null) {
            for (var index = 0; (index | 0) < (this.saves.length | 0); index = ((index | 0) + 1) | 0) {
                newSave[index | 0] = this.saves[index | 0] | 0;
            }
        }
        //Assign the new array out:
        this.saves = newSave;
    }
}
GameBoyAdvanceEEPROMChip.prototype.load = function (save) {
    if ((save.length | 0) == 0x200 || (save.length | 0) == 0x2000) {
        this.saves = save;
    }
}
GameBoyAdvanceEEPROMChip.prototype.read8 = function () {
    var data = 1;
    if ((this.mode | 0) == 1) {
        this.bitsProcessed = ((this.bitsProcessed | 0) + 1) | 0;
        if ((this.bitsProcessed | 0) > 4) {
            //Read:
            var bitOffset = ((this.bitsProcessed | 0) - 5) | 0;
            var address = ((bitOffset >> 3) + (this.readAddress | 0)) | 0;
            data = (this.saves[address | 0] >> ((0x7 - (bitOffset & 0x7)) | 0)) & 0x1;
            if ((bitOffset | 0) == 0x40) {
                //Finished read and now idle:
                this.resetMode();
            }
        }
        else {
            //Junk 4 bits EEPROM transers on read:
            data = 0;
        }
    }
    return data | 0;
}
GameBoyAdvanceEEPROMChip.prototype.read16 = function (address) {
    var data = this.read8() | 0;
    data |= this.read8() << 8;
    return data | 0;
}
GameBoyAdvanceEEPROMChip.prototype.read32 = function (address) {
    var data = this.read16() | 0;
    data |= this.read16() << 16;
    return data | 0;
}
GameBoyAdvanceEEPROMChip.prototype.write = function (data) {
    data = data & 0x1;
    switch (this.mode | 0) {
        //Address Mode:
        case 0:
            this.addressMode(data | 0);
            break;
        //Read Mode:
        case 0x1:
            this.resetMode();
            break;
        //Write Mode:
        case 0x2:
            this.writeMode(data | 0);
            
    }
}
GameBoyAdvanceEEPROMChip.prototype.addressMode = function (data) {
    data = data | 0;
    switch (this.bitsProcessed | 0) {
        case 0x8:
            //6 bit address mode:
            this.readAddress = this.buffer[0] & 0x3F;
            this.changeModeToActive(data | 0);
            break;
        case 0x10:
            //14 bit address mode:
            this.readAddress = ((this.buffer[0] & 0x3F) << 8) | this.buffer[1];
            this.changeModeToActive(data | 0);
            break;
        case 0x11:
            //N/A
            this.resetMode();
            break;
        default:
            //Push address bits through:
            this.pushBuffer(data | 0);
    }
}
GameBoyAdvanceEEPROMChip.prototype.writeMode = function (data) {
    data = data | 0;
    if ((this.bitsProcessed | 0) == 0x40) {
        //64 bits buffered, so copy our buffer to the save data:
        this.copyBuffer();
        //Reset back to initial:
        this.resetMode();
    }
    else {
        //Push a bit into the buffer:
        this.pushBuffer(data | 0);
    }
}
GameBoyAdvanceEEPROMChip.prototype.changeModeToActive = function (data) {
    data = data | 0;
    //Addressing in units of 8 bytes:
    this.readAddress <<= 3;
    //Determine R/W Mode:
    switch (this.buffer[0] & 0xC0) {
        case 0:
            //N/A:
            this.resetMode();
            break;
        case 0x80:
            //Write Mode:
            this.changeMode(0x2);
            break;
        case 0xC0:
            //Read Mode:
            if ((data | 0) == 0) {
                this.changeMode(0x1);
            }
            else {
                this.resetMode();
            }
    }
}
GameBoyAdvanceEEPROMChip.prototype.pushBuffer = function (data) {
    data = data | 0;
    //Push a bit through our serial buffer:
    var bufferPosition = this.bitsProcessed >> 8;
    this.buffer[bufferPosition & 0x7] = ((this.buffer[bufferPosition & 0x7] << 1) & 0xFE) | (data & 0x1);
    this.bitsProcessed = ((this.bitsProcessed | 0) + 1) | 0;
}
GameBoyAdvanceEEPROMChip.prototype.copyBuffer = function () {
    //Save the data:
    for (var index = 0; (index | 0) < 8; index = ((index | 0) + 1) | 0) {
        this.saves[this.readAddress | index] = this.buffer[index & 0x7] & 0xFF;
    }
}
GameBoyAdvanceEEPROMChip.prototype.resetMode = function () {
    //Reset back to idle:
    this.changeMode(1);
}
GameBoyAdvanceEEPROMChip.prototype.changeMode = function (mode) {
    //Change mode and reset buffer:
    this.mode = mode | 0;
    this.bitsProcessed = 0;
}