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
function GameBoyAdvanceChannel1AttributeTable(sound) {
    this.sound = sound;
    this.currentSampleLeft = 0;
    this.currentSampleLeftSecondary = 0;
    this.currentSampleLeftTrimary = 0;
    this.currentSampleRight = 0;
    this.currentSampleRightSecondary = 0;
    this.currentSampleRightTrimary = 0;
    this.SweepFault = false;
    this.lastTimeSweep = 0;
    this.timeSweep = 0;
    this.frequencySweepDivider = 0;
    this.decreaseSweep = false;
    this.nr11 = 0;
    this.CachedDuty = sound.dutyLookup[0];
    this.totalLength = 0x40;
    this.nr12 = 0;
    this.envelopeVolume = 0;
    this.frequency = 0;
    this.FrequencyTracker = 0x8000;
    this.nr14 = 0;
    this.consecutive = true;
    this.ShadowFrequency = 0x8000;
    this.canPlay = false;
    this.Enabled = false;
    this.envelopeSweeps = 0;
    this.envelopeSweepsLast = -1;
    this.FrequencyCounter = 0;
    this.DutyTracker = 0;
    this.Swept = false;
}
GameBoyAdvanceChannel1Synth.prototype.clockAudioLength = function () {
    if ((this.totalLength | 0) > 1) {
        this.totalLength = ((this.totalLength | 0) - 1) | 0;
    }
    else if ((this.totalLength | 0) == 1) {
        this.totalLength = 0;
        this.enableCheck();
        this.sound.nr52 &= 0xFE;    //Channel #1 On Flag Off
    }
}
GameBoyAdvanceChannel1Synth.prototype.enableCheck = function () {
    this.Enabled = ((this.consecutive || (this.totalLength | 0) > 0) && !this.SweepFault && this.canPlay);
}
GameBoyAdvanceChannel1Synth.prototype.volumeEnableCheck = function () {
    this.canPlay = ((this.nr12 | 0) > 7);
    this.enableCheck();
}
GameBoyAdvanceChannel1Synth.prototype.outputLevelCache = function () {
    this.currentSampleLeft = (this.sound.leftChannel1) ? (this.envelopeVolume | 0) : 0;
    this.currentSampleRight = (this.sound.rightChannel1) ? (this.envelopeVolume | 0) : 0;
    this.outputLevelSecondaryCache();
}
GameBoyAdvanceChannel1Synth.prototype.outputLevelSecondaryCache = function () {
    if (this.Enabled) {
        this.currentSampleLeftSecondary = this.currentSampleLeft | 0;
        this.currentSampleRightSecondary = this.currentSampleRight | 0;
    }
    else {
        this.currentSampleLeftSecondary = 0;
        this.currentSampleRightSecondary = 0;
    }
    this.outputLevelTrimaryCache();
}
GameBoyAdvanceChannel1Synth.prototype.outputLevelTrimaryCache = function () {
    if (this.CachedDuty[this.DutyTracker | 0]) {
        this.currentSampleLeftTrimary = this.currentSampleLeftSecondary | 0;
        this.currentSampleRightTrimary = this.currentSampleRightSecondary | 0;
    }
    else {
        this.currentSampleLeftTrimary = 0;
        this.currentSampleRightTrimary = 0;
    }
}
GameBoyAdvanceChannel1Synth.prototype.clockAudioSweep = function () {
    //Channel 1:
    if (!this.SweepFault && (this.timeSweep | 0) > 0) {
        this.timeSweep = ((this.timeSweep | 0) - 1) | 0
        if ((this.timeSweep | 0) == 0) {
            this.runAudioSweep();
        }
    }
}
GameBoyAdvanceChannel1Synth.prototype.runAudioSweep = function () {
    //Channel 1:
    if ((this.lastTimeSweep | 0) > 0) {
        if ((this.frequencySweepDivider | 0) > 0) {
            this.Swept = true;
            if (this.decreaseSweep) {
                this.ShadowFrequency = ((this.ShadowFrequency | 0) - (this.ShadowFrequency >> (this.frequencySweepDivider | 0))) | 0;
                this.frequency = this.ShadowFrequency & 0x7FF;
                this.FrequencyTracker = (0x800 - (this.frequency | 0)) << 4;
            }
            else {
                this.ShadowFrequency = ((this.ShadowFrequency | 0) + (this.ShadowFrequency >> (this.frequencySweepDivider | 0))) | 0;
                this.frequency = this.ShadowFrequency | 0;
                if ((this.ShadowFrequency | 0) <= 0x7FF) {
                    this.FrequencyTracker = (0x800 - (this.frequency | 0)) << 4;
                    //Run overflow check twice:
                    if ((((this.ShadowFrequency | 0) + (this.ShadowFrequency >> (this.frequencySweepDivider | 0))) | 0) > 0x7FF) {
                        this.SweepFault = true;
                        this.enableCheck();
                        this.sound.nr52 &= 0xFE;    //Channel #1 On Flag Off
                    }
                }
                else {
                    this.frequency &= 0x7FF;
                    this.SweepFault = true;
                    this.enableCheck();
                    this.sound.nr52 &= 0xFE;    //Channel #1 On Flag Off
                }
            }
            this.timeSweep = this.lastTimeSweep | 0;
        }
        else {
            //Channel has sweep disabled and timer becomes a length counter:
            this.SweepFault = true;
            this.enableCheck();
        }
    }
}
GameBoyAdvanceChannel1Synth.prototype.audioSweepPerformDummy = function () {
    //Channel 1:
    if ((this.frequencySweepDivider | 0) > 0) {
        if (!this.decreaseSweep) {
            var channel1ShadowFrequency = ((this.ShadowFrequency | 0) + (this.ShadowFrequency >> (this.frequencySweepDivider | 0))) | 0;
            if ((channel1ShadowFrequency | 0) <= 0x7FF) {
                //Run overflow check twice:
                if ((((channel1ShadowFrequency | 0) + (channel1ShadowFrequency >> (this.frequencySweepDivider | 0))) | 0) > 0x7FF) {
                    this.SweepFault = true;
                    this.enableCheck();
                    this.sound.nr52 &= 0xFE;    //Channel #1 On Flag Off
                }
            }
            else {
                this.SweepFault = true;
                this.enableCheck();
                this.sound.nr52 &= 0xFE;    //Channel #1 On Flag Off
            }
        }
    }
}
GameBoyAdvanceChannel1Synth.prototype.clockAudioEnvelope = function () {
    if ((this.envelopeSweepsLast | 0) > -1) {
        if ((this.envelopeSweeps | 0) > 0) {
            this.envelopeSweeps = ((this.envelopeSweeps | 0) - 1) | 0;
        }
        else {
            if (!this.envelopeType) {
                if ((this.envelopeVolume | 0) > 0) {
                    this.envelopeVolume = ((this.envelopeVolume | 0) - 1) | 0;
                    this.envelopeSweeps = this.envelopeSweepsLast | 0;
                }
                else {
                    this.envelopeSweepsLast = -1;
                }
            }
            else if ((this.envelopeVolume | 0) < 0xF) {
                this.envelopeVolume = ((this.envelopeVolume | 0) + 1) | 0;
                this.envelopeSweeps = this.envelopeSweepsLast | 0;
            }
            else {
                this.envelopeSweepsLast = -1;
            }
        }
    }
}
GameBoyAdvanceChannel1Synth.prototype.computeAudioChannel = function () {
    if ((this.FrequencyCounter | 0) == 0) {
        this.FrequencyCounter = this.FrequencyTracker | 0;
        this.DutyTracker = ((this.DutyTracker | 0) + 1) & 0x7;
    }
}