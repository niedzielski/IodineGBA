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
function GameBoyAdvanceFLASHChip() {
    this.largestSizePossible = 0x20000; //Figure out auto-detect of this too.
    this.notATMEL = true;   //TODO: Figure out ATMEL detection. (Sonic Advance requires ATMEL, Pokemon requires not-ATMEL)
    this.saves = null;
    this.BANKOffset = 0;
    this.flashCommandUnlockStage = 0;
    this.IDMode = false;
    this.writeBytesLeft = 0;
}
GameBoyAdvanceFLASHChip.prototype.initialize = function () {
    this.allocate();
}
GameBoyAdvanceFLASHChip.prototype.allocate = function () {
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
GameBoyAdvanceFLASHChip.prototype.load = function (save) {
    if ((save.length | 0) == 0x10000 || (save.length | 0) == 0x20000) {
        this.saves = save;
        if ((save.length | 0) == 0x20000) {
            this.notATMEL = true;
        }
    }
}
GameBoyAdvanceFLASHChip.prototype.read = function (address) {
    address = address | 0;
    var data = 0;
    switch (address | 0) {
        case 0:
            if (!this.IDMode) {
                data = this.saves[0] | 0;
            }
            else if (this.notATMEL) {
                data = ((this.largestSizePossible | 0) == 0x20000) ? 0x62 : 0xBF;
            }
            else {
                data = 0x1F;
            }
            break;
        case 1:
            if (!this.IDMode) {
                data = this.saves[1] | 0;
            }
            else if (this.notATMEL) {
                data = ((this.largestSizePossible | 0) == 0x20000) ? 0x13 : 0xD4;
            }
            else {
                data = 0x3D;
            }
            break;
        default:
            data = this.saves[address | this.BANKOffset] | 0;
    }
    return data | 0;
}
GameBoyAdvanceFLASHChip.prototype.write = function (address, data) {
    address = address | 0;
    data = data | 0;
    if ((this.writeBytesLeft | 0) == 0) {
        this.writeControlBits(address | 0, data | 0);
    }
    else {
        this.writeByte(address | 0, data | 0);
    }
}
GameBoyAdvanceFLASHChip.prototype.writeControlBits = function (address, data) {
    address = address | 0;
    data = data | 0;
    switch (address | 0) {
        case 0:
        case 0x1000:
        case 0x2000:
        case 0x3000:
        case 0x4000:
        case 0x5000:
        case 0x6000:
        case 0x7000:
        case 0x8000:
        case 0x9000:
        case 0xA000:
        case 0xB000:
        case 0xC000:
        case 0xD000:
        case 0xE000:
        case 0xF000:
            if ((this.flashCommandUnlockStage | 0) == 5 && ((data | 0) == 0x30)) {
                var addressEnd = ((address | 0) + 0x1000) | 0;
                for (var index = address | 0; (index | 0) < (addressEnd | 0); index = ((index | 0) + 1) | 0) {
                    this.saves[index | this.BANKOffset] = 0xFF;
                }
                this.notATMEL = true;
            }
            else if ((this.flashCommandUnlockStage | 0) == 3 && (address | 0) == 0) {
                this.selectBank(data & 0x1);
            }
            this.flashCommandUnlockStage = 0;
            break;
        case 0x5555:
            switch (data | 0) {
                case 0x10:
                    if ((this.flashCommandUnlockStage | 0) == 5 && ((data | 0) == 0x30)) {
                        for (var index = 0; (index | 0) < (this.largestSizePossible | 0); index = ((index | 0) + 1) | 0) {
                            this.saves[index | 0] = 0xFF;
                        }
                        this.flashCommandUnlockStage = 0;
                    }
                    break;
                case 0x80:
                    if ((this.flashCommandUnlockStage | 0) == 2) {
                        this.flashCommandUnlockStage = 3;
                    }
                    else {
                        this.flashCommandUnlockStage = 0;
                    }
                    break;
                case 0x90:
                    if ((this.flashCommandUnlockStage | 0) == 2) {
                        this.IDMode = true;
                    }
                    this.flashCommandUnlockStage = 0;
                    break;
                case 0xA0:
                    if ((this.flashCommandUnlockStage | 0) == 3) {
                        if (this.notATMEL) {
                            this.writeBytesLeft = 1;
                        }
                        else {
                            this.writeBytesLeft = 128;
                        }
                        this.flashCommandUnlockStage = 0;
                    }
                    break;
                case 0xAA:
                    this.flashCommandUnlockStage = ((this.flashCommandUnlockStage | 0) == 3) ? 4 : 1;
                    break;
                case 0xB0:
                    if ((this.flashCommandUnlockStage | 0) == 2) {
                        this.flashCommandUnlockStage = 3;
                    }
                    else {
                        this.flashCommandUnlockStage = 0;
                    }
                    break;
                case 0xF0:
                    if ((this.flashCommandUnlockStage | 0) == 5) {
                        this.IDMode = false;
                    }
                    this.flashCommandUnlockStage = 0;
                    break;
                default:
                    this.flashCommandUnlockStage = 0;
            }
            break;
        case 0x2AAA:
            if ((data | 0) == 0x55 && ((this.flashCommandUnlockStage | 0) == 1 || (this.flashCommandUnlockStage | 0) == 4)) {
                this.flashCommandUnlockStage = ((this.flashCommandUnlockStage | 0) + 1) | 0;
            }
            else {
                this.flashCommandUnlockStage = 0;
            }
    }
}
GameBoyAdvanceFLASHChip.prototype.writeByte = function (address, data) {
    address = address | this.BANKOffset;
    data = data | 0;
    this.saves[address | 0] = data | 0;
    this.writeBytesLeft = ((this.writeBytesLeft | 0) - 1) | 0;
}
GameBoyAdvanceFLASHChip.prototype.selectBank = function (bankNumber) {
    bankNumber = bankNumber | 0;
    this.BANKOffset = (bankNumber & 0x1) << 16;
    this.largestSizePossible = Math.max((0x10000 + (this.BANKOffset | 0)) | 0, this.largestSizePossible | 0) | 0;
    this.notATMEL = true;
    this.allocate();
}