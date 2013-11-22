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
function GameBoyAdvanceChannel3AttributeTable(sound) {
    this.currentSampleLeft = 0;
    this.currentSampleLeftSecondary = 0;
    this.currentSampleRight = 0;
    this.currentSampleRightSecondary = 0;
    this.lastSampleLookup = 0;
    this.canPlay = false;
    this.WAVERAMBankSpecified = 0;
    this.WAVERAMBankAccessed = 0x20;
    this.WaveRAMBankSize = 0x1F;
    this.totalLength = 0x100;
    this.patternType = 4;
    this.frequency = 0;
    this.FrequencyPeriod = 0x4000;
    this.consecutive = true;
    this.Enabled = false;
    this.nr30 = 0;
    this.nr31 = 0;
    this.nr32 = 0;
    this.nr33 = 0;
    this.nr34 = 0;
    this.PCM = getInt8Array(0x40);
    this.WAVERAM = getUint8Array(0x20);
}