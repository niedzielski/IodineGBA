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
function GameBoyAdvanceGraphics(IOCore) {
	this.IOCore = IOCore;
	this.emulatorCore = IOCore.emulatorCore;
	this.initializeIO();
	this.initializeRenderer();
}
GameBoyAdvanceGraphics.prototype.initializeIO = function () {
	//Initialize Pre-Boot:
	this.BGMode = 0;
	this.HBlankIntervalFree = false;
	this.VRAMOneDimensional = false;
	this.forcedBlank = false;
	this.displayBG0 = false;
	this.displayBG1 = false;
	this.displayBG2 = false;
	this.displayBG3 = false;
	this.displayOBJ = false;
	this.displayWindow0Flag = false;
	this.displayWindow1Flag = false;
	this.displayObjectWindowFlag = false;
	this.greenSwap = false;
	this.inVBlank = false;
	this.inHBlank = false;
	this.VCounterMatch = false;
	this.IRQVBlank = false;
	this.IRQHBlank = false;
	this.IRQVCounter = false;
	this.VCounter = 0;
	this.currentScanLine = 0;
    this.BGPriority = getUint8Array(0x4);
	this.BGCharacterBaseBlock = getUint8Array(0x4);
	this.BGMosaic = [false, false, false, false];
	this.BGPalette256 = [false, false, false, false];
	this.BGScreenBaseBlock = getUint8Array(0x4);
	this.BGDisplayOverflow = [false, false, false, false];
	this.BGScreenSize = [false, false, false, false];
	this.WINBG0Outside = false;
	this.WINBG1Outside = false;
	this.WINBG2Outside = false;
	this.WINBG3Outside = false;
	this.WINOBJOutside = false;
	this.WINEffectsOutside = false;
	this.WINOBJBG0Outside = false;
	this.WINOBJBG1Outside = false;
	this.WINOBJBG2Outside = false;
	this.WINOBJBG3Outside = false;
	this.WINOBJOBJOutside = false;
	this.WINOBJEffectsOutside = false;
	this.BGMosaicHSize = 0;
	this.BGMosaicVSize = 0;
	this.OBJMosaicHSize = 0;
	this.OBJMosaicVSize = 0;
	this.effectsTarget1 = 0;
	this.colorEffectsType = 0;
	this.effectsTarget2 = 0;
	this.alphaBlendAmountTarget1 = 0;
	this.alphaBlendAmountTarget2 = 0;
	this.brightnessEffectAmount = 0;
	this.paletteRAM = getUint8Array(0x400);
	this.VRAM = getUint8Array(0x18000);
	this.VRAM16 = getUint16View(this.VRAM);
    this.OAMRAM = getUint8Array(0x400);
	this.lineBuffer = getInt32Array(240);
	this.frameBuffer = this.emulatorCore.frameBuffer;
	this.LCDTicks = 0;
	this.totalLinesPassed = 0;
	this.queuedScanLines = 0;
	this.lastUnrenderedLine = 0;
	this.transparency = 0x3A00000;
    this.backdrop = this.transparency;
}
GameBoyAdvanceGraphics.prototype.initializeRenderer = function () {
	this.initializeMatrixStorage();
	this.initializePaletteStorage();
	this.initializeOAMTable();
	this.bg0Renderer = new GameBoyAdvanceBGTEXTRenderer(this, 0);
	this.bg1Renderer = new GameBoyAdvanceBGTEXTRenderer(this, 1);
	this.bg2TextRenderer = new GameBoyAdvanceBGTEXTRenderer(this, 2);
	this.bg3TextRenderer = new GameBoyAdvanceBGTEXTRenderer(this, 3);
	this.bgAffineRenderer = [
                             new GameBoyAdvanceAffineBGRenderer(this, 2),
                             new GameBoyAdvanceAffineBGRenderer(this, 3)
                             ];
    this.bg2MatrixRenderer = new GameBoyAdvanceBGMatrixRenderer(this, 2);
	this.bg3MatrixRenderer = new GameBoyAdvanceBGMatrixRenderer(this, 3);
	this.bg2FrameBufferRenderer = new GameBoyAdvanceBG2FrameBufferRenderer(this);
	this.objRenderer = new GameBoyAdvanceOBJRenderer(this);
	this.window0Renderer = new GameBoyAdvanceWindowRenderer(this);
	this.window1Renderer = new GameBoyAdvanceWindowRenderer(this);
	this.objWindowRenderer = new GameBoyAdvanceOBJWindowRenderer(this);
	this.mosaicRenderer = new GameBoyAdvanceMosaicRenderer(this);
	this.colorEffectsRenderer = new GameBoyAdvanceColorEffectsRenderer(this);
	this.mode0Renderer = new GameBoyAdvanceMode0Renderer(this);
	this.mode1Renderer = new GameBoyAdvanceMode1Renderer(this);
	this.mode2Renderer = new GameBoyAdvanceMode2Renderer(this);
	this.mode3Renderer = new GameBoyAdvanceMode3Renderer(this);
	this.mode4Renderer = new GameBoyAdvanceMode4Renderer(this);
	this.mode5Renderer = new GameBoyAdvanceMode5Renderer(this);
	this.renderer = this.mode0Renderer;
	this.compositorPreprocess();
}
GameBoyAdvanceGraphics.prototype.initializeMatrixStorage = function () {
	this.OBJMatrixParametersRaw = [];
	this.OBJMatrixParameters = [];
	for (var index = 0; index < 0x20;) {
		this.OBJMatrixParametersRaw[index] = getUint16Array(0x4);
		this.OBJMatrixParameters[index++] = getFloat32Array(0x4);
	}
}
GameBoyAdvanceGraphics.prototype.initializePaletteStorage = function () {
	//Both BG and OAM in unified storage:
	this.palette256 = getInt32Array(0x100);
	this.palette256[0] |= this.transparency;
    this.paletteOBJ256 = getInt32Array(0x100);
	this.paletteOBJ256[0] |= this.transparency;
    this.palette16 = [];
	this.paletteOBJ16 = [];
	for (var index = 0; index < 0x10; ++index) {
		this.palette16[index] = getInt32Array(0x10);
		this.palette16[index][0] = this.transparency;
        this.paletteOBJ16[index] = getInt32Array(0x10);
        this.paletteOBJ16[index][0] = this.transparency;
	}
}
GameBoyAdvanceGraphics.prototype.initializeOAMTable = function () {
	this.OAMTable = [];
	for (var spriteNumber = 0; spriteNumber < 128; ++spriteNumber) {
		this.OAMTable[spriteNumber] = new GameBoyAdvanceOAMAttributeTable();
	}
}
GameBoyAdvanceGraphics.prototype.addClocks = function (clocks) {
	//Call this when clocking the state some more:
	this.LCDTicks += clocks;
	this.clockLCDState();
}
GameBoyAdvanceGraphics.prototype.clockLCDState = function () {
	if (this.LCDTicks < 1006) {
		this.inHBlank = false;										//Un-mark HBlank.
	}
	else if (this.LCDTicks < 1232) {
		this.updateHBlank();
	}
	else {
		/*We've now overflowed the LCD scan line state machine counter,
		which tells us we need to be on a new scan-line and refresh over.*/
		//Make sure we ran the h-blank check this scan line:
		this.updateHBlank();
		//De-clock for starting on new scan-line:
		this.LCDTicks -= 1232;										//We start out at the beginning of the next line.
		//Handle switching in/out of vblank:
		switch (this.currentScanLine) {
			case 159:
				this.incrementScanLineQueue();
                this.updateVBlankStart();
				this.currentScanLine = 160;							//Increment to the next scan line (Start of v-blank).
				break;
			case 161:
				this.IOCore.dma.gfxDisplaySyncKillRequest();		//Display Sync. DMA stop.
				++this.currentScanLine;								//Increment to the next scan line.
				break;
			case 226:
				this.inVBlank = false;								//Un-mark VBlank.
				this.currentScanLine = 227;							//Increment to the next scan line (Last line of v-blank).
				break;
			case 227:
				this.currentScanLine = 0;							//Reset scan-line to zero (First line of draw).
				break;
			default:
				++this.currentScanLine;								//Increment to the next scan line.
				if (!this.inVBlank) {
					this.incrementScanLineQueue();
				}
		}
		this.checkDisplaySync();
		this.checkVCounter();										//We're on a new scan line, so check the VCounter for match.
		//Recursive clocking of the LCD state:
		this.clockLCDState();
	}
}
GameBoyAdvanceGraphics.prototype.updateHBlank = function () {
	if (!this.inHBlank) {											//If we were last in HBlank, don't run this again.
		this.inHBlank = true;										//Mark HBlank.
		if (this.IRQHBlank && this.currentScanLine < 160) {			//Check for HBlank IRQ.
			this.IOCore.irq.requestIRQ(0x2);
		}
	}
}
GameBoyAdvanceGraphics.prototype.checkDisplaySync = function () {
	if (this.currentScanLine > 1 && this.currentScanLine < 162) {
		this.IOCore.dma.gfxDisplaySyncRequest();					//Display Sync. DMA trigger.
	}
}
GameBoyAdvanceGraphics.prototype.checkVCounter = function () {
	if (this.currentScanLine == this.VCounter) {					//Check for VCounter match.
		this.VCounterMatch = true;
		if (this.IRQVCounter) {										//Check for VCounter IRQ.
			this.IOCore.irq.requestIRQ(0x4);
		}
	}
	else {
		this.VCounterMatch = false;
	}
}
GameBoyAdvanceGraphics.prototype.nextVBlankEventTime = function () {
	return ((1 + ((387 - this.currentScanLine) % 228)) * 1232) - this.LCDTicks;
}
GameBoyAdvanceGraphics.prototype.nextVBlankIRQEventTime = function () {
	return (this.IRQVBlank) ? this.nextVBlankEventTime() : -1;
}
GameBoyAdvanceGraphics.prototype.nextHBlankEventTime = function () {
	return (2238 - this.LCDTicks) % 1232;
}
GameBoyAdvanceGraphics.prototype.nextHBlankIRQEventTime = function () {
	return (this.IRQHBlank) ? this.nextHBlankEventTime() : -1;
}
GameBoyAdvanceGraphics.prototype.nextVCounterEventTime = function () {
	return ((1 + ((227 + this.VCounter - this.currentScanLine) % 228)) * 1232) - this.LCDTicks;
}
GameBoyAdvanceGraphics.prototype.nextVCounterIRQEventTime = function () {
	return (this.IRQVCounter) ? this.nextVCounterEventTime() : -1;
}
GameBoyAdvanceGraphics.prototype.nextDisplaySyncEventTime = function () {
	if (this.currentScanLine < 2) {
		return ((2 - this.currentScanLine) * 1232) - this.LCDTicks;
	}
	else if (this.currentScanLine < 161) {
		return 1232 - this.LCDTicks;
	}
	else {
		return ((68 - this.currentScanLine) * 1232) - this.LCDTicks;
	}
}
GameBoyAdvanceGraphics.prototype.updateVBlankStart = function () {
	this.inVBlank = true;								//Mark VBlank.
	if (this.IRQVBlank) {								//Check for VBlank IRQ.
		this.IOCore.irq.requestIRQ(0x1);
	}
	//Ensure JIT framing alignment:
	if (this.totalLinesPassed < 160) {
		//Make sure our gfx are up-to-date:
		this.graphicsJITVBlank();
		//Draw the frame:
		this.emulatorCore.prepareFrame();
	}
	this.bgAffineRenderer[0].resetReferenceCounters();
    this.bgAffineRenderer[1].resetReferenceCounters();
}
GameBoyAdvanceGraphics.prototype.graphicsJIT = function () {
	this.totalLinesPassed = 0;			//Mark frame for ensuring a JIT pass for the next framebuffer output.
	this.graphicsJITScanlineGroup();
}
GameBoyAdvanceGraphics.prototype.graphicsJITVBlank = function () {
	//JIT the graphics to v-blank framing:
	this.totalLinesPassed += this.queuedScanLines;
	this.graphicsJITScanlineGroup();
}
GameBoyAdvanceGraphics.prototype.graphicsJITScanlineGroup = function () {
	//Normal rendering JIT, where we try to do groups of scanlines at once:
	while (this.queuedScanLines > 0) {
		this.renderer.renderScanLine(this.lastUnrenderedLine);
		if (this.lastUnrenderedLine < 159) {
			++this.lastUnrenderedLine;
		}
		else {
			this.lastUnrenderedLine = 0;
		}
		--this.queuedScanLines;
	}
}
GameBoyAdvanceGraphics.prototype.incrementScanLineQueue = function () {
	if (this.queuedScanLines < 160) {
		++this.queuedScanLines;
	}
	else {
		if (this.lastUnrenderedLine < 159) {
			++this.lastUnrenderedLine;
		}
		else {
			this.lastUnrenderedLine = 0;
		}
	}
}
GameBoyAdvanceGraphics.prototype.isRendering = function () {
	return (!this.forcedBlank && this.currentScanLine < 160 && !this.inHBlank);
}
GameBoyAdvanceGraphics.prototype.OAMLockedCycles = function () {
	if (!this.forcedBlank && this.currentScanLine < 160) {
		if (this.HBlankIntervalFree) {
			//Delay OAM access until horizontal blank:
			return this.nextHBlankEventTime();
		}
		else {
			//Delay OAM access until vertical blank:
			return this.nextVBlankEventTime();
		}
	}
	return 0;
}
GameBoyAdvanceGraphics.prototype.midScanLineJIT = function () {
	//No mid-scanline JIT for now, instead just do per-scanline:
	this.graphicsJIT();
}
GameBoyAdvanceGraphics.prototype.compositorPreprocess = function () { 
	this.compositeLayers = (this.WINEffectsOutside) ? this.compositeLayersWithEffects : this.compositeLayersNormal;
}
GameBoyAdvanceGraphics.prototype.compositeLayersNormal = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
	//Arrange our layer stack so we can remove disabled and order for correct edge case priority:
	if (this.displayObjectWindowFlag || this.displayWindow1Flag || this.displayWindow0Flag) {
		//Window registers can further disable background layers if one or more window layers enabled:
		OBJBuffer = (this.WINOBJOutside) ? OBJBuffer : null;
		BG0Buffer = (this.WINBG0Outside) ? BG0Buffer : null;
		BG1Buffer = (this.WINBG1Outside) ? BG1Buffer : null;
		BG2Buffer = (this.WINBG2Outside) ? BG2Buffer : null;
		BG3Buffer = (this.WINBG3Outside) ? BG3Buffer : null;
	}
	var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
	var stackDepth = layerStack.length;
	var stackIndex = 0;
	//Loop through each pixel on the line:
	for (var pixelPosition = 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0; pixelPosition < 240; ++pixelPosition) {
		//Start with backdrop color:
		lowerPixel = currentPixel = this.backdrop;
		//Loop through all layers each pixel to resolve priority:
		for (stackIndex = 0; stackIndex < stackDepth; ++stackIndex) {
			workingPixel = layerStack[stackIndex][pixelPosition];
			if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
				/*
					If higher priority than last pixel and not transparent.
					Also clear any plane layer bits other than backplane for
					transparency.
				*/
				lowerPixel = currentPixel;
				currentPixel = workingPixel;
			}
		}
		if ((currentPixel & 0x400000) == 0) {
			//Normal Pixel:
			this.lineBuffer[pixelPosition] = currentPixel;
		}
		else {
			//OAM Pixel Processing:
			//Pass the highest two pixels to be arbitrated in the color effects processing:
			this.lineBuffer[pixelPosition] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel, currentPixel);
		}
	}
}
GameBoyAdvanceGraphics.prototype.compositeLayersWithEffects = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
	//Arrange our layer stack so we can remove disabled and order for correct edge case priority:
	if (this.displayObjectWindowFlag || this.displayWindow1Flag || this.displayWindow0Flag) {
		//Window registers can further disable background layers if one or more window layers enabled:
		OBJBuffer = (this.WINOBJOutside) ? OBJBuffer : null;
		BG0Buffer = (this.WINBG0Outside) ? BG0Buffer : null;
		BG1Buffer = (this.WINBG1Outside) ? BG1Buffer : null;
		BG2Buffer = (this.WINBG2Outside) ? BG2Buffer : null;
		BG3Buffer = (this.WINBG3Outside) ? BG3Buffer : null;
	}
	var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
	var stackDepth = layerStack.length;
	var stackIndex = 0;
	//Loop through each pixel on the line:
	for (var pixelPosition = 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0; pixelPosition < 240; ++pixelPosition) {
		//Start with backdrop color:
		lowerPixel = currentPixel = this.backdrop;
		//Loop through all layers each pixel to resolve priority:
		for (stackIndex = 0; stackIndex < stackDepth; ++stackIndex) {
			workingPixel = layerStack[stackIndex][pixelPosition];
			if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
				/*
					If higher priority than last pixel and not transparent.
					Also clear any plane layer bits other than backplane for
					transparency.
					
					Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
				*/
				lowerPixel = currentPixel;
				currentPixel = workingPixel;
			}
		}
		if ((currentPixel & 0x400000) == 0) {
			//Normal Pixel:
			//Pass the highest two pixels to be arbitrated in the color effects processing:
			this.lineBuffer[pixelPosition] = this.colorEffectsRenderer.process(lowerPixel, currentPixel);
		}
		else {
			//OAM Pixel Processing:
			//Pass the highest two pixels to be arbitrated in the color effects processing:
			this.lineBuffer[pixelPosition] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel, currentPixel);
		}
	}
}
GameBoyAdvanceGraphics.prototype.cleanLayerStack = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
	//Clear out disabled layers from our stack:
	var layerStack = [];
	if (BG3Buffer) {
		layerStack.push(BG3Buffer);
	}
	if (BG2Buffer) {
		layerStack.push(BG2Buffer);
	}
	if (BG1Buffer) {
		layerStack.push(BG1Buffer);
	}
	if (BG0Buffer) {
		layerStack.push(BG0Buffer);
	}
	if (OBJBuffer) {
		layerStack.push(OBJBuffer);
	}
	return layerStack;
}
GameBoyAdvanceGraphics.prototype.copyLineToFrameBuffer = function (line) {
	var offsetStart = line * 240;
	var position = 0;
	if (!this.greenSwap) {
		for (; position < 240; ++offsetStart) {
			this.frameBuffer[offsetStart] = this.lineBuffer[position++];
		}
	}
	else {
		var pixel0 = 0;
		var pixel1 = 0;
		while (position < 240) {
			pixel0 = this.lineBuffer[position++];
			pixel1 = this.lineBuffer[position++];
			this.frameBuffer[offsetStart++] = (pixel0 & 0x7C1F) | (pixel1 & 0x3E0);
			this.frameBuffer[offsetStart++] = (pixel1 & 0x7C1F) | (pixel0 & 0x3E0);
		}
	}
}
GameBoyAdvanceGraphics.prototype.writeDISPCNT0 = function (data) {
	this.midScanLineJIT();
	this.BGMode = data & 0x07;
	this.bg2FrameBufferRenderer.writeFrameSelect((data & 0x10) >> 4);
	this.HBlankIntervalFree = ((data & 0x20) == 0x20);
	this.VRAMOneDimensional = ((data & 0x40) == 0x40);
	this.forcedBlank = ((data & 0x80) == 0x80);
	switch (this.BGMode) {
		case 0:
			this.renderer = this.mode0Renderer;
			break;
		case 1:
			this.renderer = this.mode1Renderer;
			break;
		case 2:
			this.renderer = this.mode2Renderer;
			break;
		case 3:
			this.renderer = this.mode3Renderer;
			this.renderer.preprocess();
			break;
		case 4:
			this.renderer = this.mode4Renderer;
			this.renderer.preprocess();
			break;
		//case 5:
		//Make the prohibited codes select mode 5?
		default:
			this.renderer = this.mode5Renderer;
			this.renderer.preprocess();
	}
}
GameBoyAdvanceGraphics.prototype.readDISPCNT0 = function () {
	return (this.BGMode |
	((this.bg2FrameBufferRenderer.frameSelect > 0) ? 0x10 : 0) |
	(this.HBlankIntervalFree ? 0x20 : 0) | 
	(this.VRAMOneDimensional ? 0x40 : 0) |
	(this.forcedBlank ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeDISPCNT1 = function (data) {
	this.midScanLineJIT();
	this.displayBG0 = ((data & 0x01) == 0x01);
	this.displayBG1 = ((data & 0x02) == 0x02);
	this.displayBG2 = ((data & 0x04) == 0x04);
	this.displayBG3 = ((data & 0x08) == 0x08);
	this.displayOBJ = ((data & 0x10) == 0x10);
	this.displayWindow0Flag = ((data & 0x20) == 0x20);
	this.displayWindow1Flag = ((data & 0x40) == 0x40);
	this.displayObjectWindowFlag = ((data & 0x80) == 0x80);
}
GameBoyAdvanceGraphics.prototype.readDISPCNT1 = function () {
	return ((this.displayBG0 ? 0x1 : 0) |
	(this.displayBG1 ? 0x2 : 0) |
	(this.displayBG2 ? 0x4 : 0) |
	(this.displayBG3 ? 0x8 : 0) |
	(this.displayOBJ ? 0x10 : 0) |
	(this.displayWindow0Flag ? 0x20 : 0) |
	(this.displayWindow1Flag ? 0x40 : 0) |
	(this.displayObjectWindowFlag ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeGreenSwap = function (data) {
	this.midScanLineJIT();
	this.greenSwap = ((data & 0x01) == 0x01);
}
GameBoyAdvanceGraphics.prototype.readGreenSwap = function () {
	return (this.greenSwap ? 0x1 : 0);
}
GameBoyAdvanceGraphics.prototype.writeDISPSTAT0 = function (data) {
	//VBlank flag read only.
	//HBlank flag read only.
	//V-Counter flag read only.
	//Only LCD IRQ generation enablers can be set here:
	this.IRQVBlank = ((data & 0x08) == 0x08);
	this.IRQHBlank = ((data & 0x10) == 0x10);
	this.IRQVCounter = ((data & 0x20) == 0x20);
}
GameBoyAdvanceGraphics.prototype.readDISPSTAT0 = function () {
	return ((this.inVBlank ? 0x1 : 0) |
	(this.inHBlank ? 0x2 : 0) |
	(this.VCounterMatch ? 0x4 : 0) |
	(this.IRQVBlank ? 0x8 : 0) |
	(this.IRQHBlank ? 0x10 : 0) |
	(this.IRQVCounter ? 0x20 : 0));
}
GameBoyAdvanceGraphics.prototype.writeDISPSTAT1 = function (data) {
	//V-Counter match value:
	this.VCounter = data;
	this.checkVCounter();
}
GameBoyAdvanceGraphics.prototype.readDISPSTAT1 = function () {
	return this.VCounter;
}
GameBoyAdvanceGraphics.prototype.readVCOUNT = function () {
	return this.currentScanLine;
}
GameBoyAdvanceGraphics.prototype.writeBG0CNT0 = function (data) {
	this.midScanLineJIT();
	this.BGPriority[0] = data & 0x3;
	this.BGCharacterBaseBlock[0] = (data & 0xC) >> 2;
	//Bits 5-6 always 0.
	this.BGMosaic[0] = ((data & 0x40) == 0x40);
	this.BGPalette256[0] = ((data & 0x80) == 0x80);
	this.bg0Renderer.palettePreprocess();
    this.bg0Renderer.priorityPreprocess();
    this.bg0Renderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG0CNT0 = function () {
	return (this.BGPriority[0] |
	(this.BGCharacterBaseBlock[0] << 2) |
	(this.BGMosaic[0] ? 0x40 : 0) |
	(this.BGPalette256[0] ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeBG0CNT1 = function (data) {
	this.midScanLineJIT();
	this.BGScreenBaseBlock[0] = data & 0x1F;
	this.BGDisplayOverflow[0] = ((data & 0x20) == 0x20);	//Note: Only applies to BG2/3 supposedly.
	this.BGScreenSize[0] = (data & 0xC0) >> 6;
	this.bg0Renderer.screenSizePreprocess();
    this.bg0Renderer.screenBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG0CNT1 = function () {
	return (this.BG0ScreenBaseBlock |
	(this.BG0DisplayOverflow ? 0x20 : 0) |
	(this.BG0ScreenSize << 6));
}
GameBoyAdvanceGraphics.prototype.writeBG1CNT0 = function (data) {
	this.midScanLineJIT();
	this.BGPriority[1] = data & 0x3;
	this.BGCharacterBaseBlock[1] = (data & 0xC) >> 2;
	//Bits 5-6 always 0.
	this.BGMosaic[1] = ((data & 0x40) == 0x40);
	this.BGPalette256[1] = ((data & 0x80) == 0x80);
	this.bg1Renderer.palettePreprocess();
    this.bg1Renderer.priorityPreprocess();
    this.bg1Renderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG1CNT0 = function () {
	return (this.BGPriority[1] |
	(this.BGCharacterBaseBlock[1] << 2) |
	(this.BGMosaic[1] ? 0x40 : 0) |
	(this.BGPalette256[1] ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeBG1CNT1 = function (data) {
	this.midScanLineJIT();
	this.BGScreenBaseBlock[1] = data & 0x1F;
	this.BGDisplayOverflow[1] = ((data & 0x20) == 0x20);	//Note: Only applies to BG2/3 supposedly.
	this.BGScreenSize[1] = (data & 0xC0) >> 6;
	this.bg1Renderer.screenSizePreprocess();
    this.bg1Renderer.screenBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG1CNT1 = function () {
	return (this.BGScreenBaseBlock[1] |
	(this.BGDisplayOverflow[1] ? 0x20 : 0) |
	(this.BGScreenSize[1] << 6));
}
GameBoyAdvanceGraphics.prototype.writeBG2CNT0 = function (data) {
	this.midScanLineJIT();
	this.BGPriority[2] = data & 0x3;
	this.BGCharacterBaseBlock[2] = (data & 0xC) >> 2;
	//Bits 5-6 always 0.
	this.BGMosaic[2] = ((data & 0x40) == 0x40);
	this.BGPalette256[2] = ((data & 0x80) == 0x80);
	this.bg2TextRenderer.palettePreprocess();
    this.bg2TextRenderer.priorityPreprocess();
	this.bgAffineRenderer[0].priorityPreprocess();
    this.bg2TextRenderer.characterBaseBlockPreprocess();
    this.bg2MatrixRenderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG2CNT0 = function () {
	return (this.BGPriority[2] |
	(this.BGCharacterBaseBlock[2] << 2) |
	(this.BGMosaic[2] ? 0x40 : 0) |
	(this.BGPalette256[2] ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeBG2CNT1 = function (data) {
	this.midScanLineJIT();
	this.BGScreenBaseBlock[2] = data & 0x1F;
	this.BGDisplayOverflow[2] = ((data & 0x20) == 0x20);
	this.BGScreenSize[2] = (data & 0xC0) >> 6;
	this.bg2TextRenderer.screenSizePreprocess();
	this.bg2MatrixRenderer.screenSizePreprocess();
    this.bg2TextRenderer.screenBaseBlockPreprocess();
    this.bg2MatrixRenderer.screenBaseBlockPreprocess();
    this.bg2MatrixRenderer.displayOverflowPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG2CNT1 = function () {
	return (this.BGScreenBaseBlock[2] |
	(this.BGDisplayOverflow[2] ? 0x20 : 0) |
	(this.BGScreenSize[2] << 6));
}
GameBoyAdvanceGraphics.prototype.writeBG3CNT0 = function (data) {
	this.midScanLineJIT();
	this.BGPriority[3] = data & 0x3;
	this.BGCharacterBaseBlock[3] = (data & 0xC) >> 2;
	//Bits 5-6 always 0.
	this.BGMosaic[3] = ((data & 0x40) == 0x40);
	this.BGPalette256[3] = ((data & 0x80) == 0x80);
	this.bg3TextRenderer.palettePreprocess();
    this.bg3TextRenderer.priorityPreprocess();
	this.bgAffineRenderer[1].priorityPreprocess();
    this.bg3TextRenderer.characterBaseBlockPreprocess();
    this.bg3MatrixRenderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG3CNT0 = function () {
	return (this.BGPriority[3] |
	(this.BGCharacterBaseBlock[3] << 2) |
	(this.BGMosaic[3] ? 0x40 : 0) |
	(this.BGPalette256[3] ? 0x80 : 0));
}
GameBoyAdvanceGraphics.prototype.writeBG3CNT1 = function (data) {
	this.midScanLineJIT();
	this.BGScreenBaseBlock[3] = data & 0x1F;
	this.BGDisplayOverflow[3] = ((data & 0x20) == 0x20);
	this.BGScreenSize[3] = (data & 0xC0) >> 6;
	this.bg3TextRenderer.screenSizePreprocess();
	this.bg3MatrixRenderer.screenSizePreprocess();
    this.bg3TextRenderer.screenBaseBlockPreprocess();
    this.bg3MatrixRenderer.screenBaseBlockPreprocess();
    this.bg3MatrixRenderer.displayOverflowPreprocess();
}
GameBoyAdvanceGraphics.prototype.readBG3CNT1 = function () {
	return (this.BGScreenBaseBlock[3] |
	(this.BGDisplayOverflow[3] ? 0x20 : 0) |
	(this.BGScreenSize[3] << 6));
}
GameBoyAdvanceGraphics.prototype.writeBG0HOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg0Renderer.writeBGHOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG0HOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg0Renderer.writeBGHOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG0VOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg0Renderer.writeBGVOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG0VOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg0Renderer.writeBGVOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG1HOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg1Renderer.writeBGHOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG1HOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg1Renderer.writeBGHOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG1VOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg1Renderer.writeBGVOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG1VOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg1Renderer.writeBGVOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2HOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg2TextRenderer.writeBGHOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2HOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg2TextRenderer.writeBGHOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2VOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg2TextRenderer.writeBGVOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2VOFS1 = function (data) {
	this.midScanLineJIT();
    this.bg2TextRenderer.writeBGVOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3HOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg3TextRenderer.writeBGHOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3HOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg3TextRenderer.writeBGHOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3VOFS0 = function (data) {
	this.midScanLineJIT();
	this.bg3TextRenderer.writeBGVOFS0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3VOFS1 = function (data) {
	this.midScanLineJIT();
	this.bg3TextRenderer.writeBGVOFS1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PA0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPA0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PA1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPA1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PB0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPB0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PB1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPB1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PC0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPC0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PC1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPC1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PD0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPD0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2PD1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGPD1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PA0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPA0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PA1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPA1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PB0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPB0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PB1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPB1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PC0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPC0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PC1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPC1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PD0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPD0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3PD1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGPD1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2X_L0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGX_L0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2X_L1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGX_L1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2X_H0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGX_H0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2X_H1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGX_H1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2Y_L0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGY_L0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2Y_L1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGY_L1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2Y_H0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGY_H0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG2Y_H1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[0].writeBGY_H1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3X_L0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGX_L0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3X_L1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGX_L1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3X_H0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGX_H0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3X_H1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGX_H1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3Y_L0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGY_L0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3Y_L1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGY_L1(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3Y_H0 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGY_H0(data);
}
GameBoyAdvanceGraphics.prototype.writeBG3Y_H1 = function (data) {
	this.midScanLineJIT();
	this.bgAffineRenderer[1].writeBGY_H1(data);
}
GameBoyAdvanceGraphics.prototype.writeWIN0H0 = function (data) {
	this.midScanLineJIT();
	this.window0Renderer.WINXCoordRight = data;		//Window x-coord goes up to this minus 1.
}
GameBoyAdvanceGraphics.prototype.writeWIN0H1 = function (data) {
	this.midScanLineJIT();
	this.window0Renderer.WINXCoordLeft = data;
}
GameBoyAdvanceGraphics.prototype.writeWIN1H0 = function (data) {
	this.midScanLineJIT();
	this.window1Renderer.WINXCoordRight = data;		//Window x-coord goes up to this minus 1.
}
GameBoyAdvanceGraphics.prototype.writeWIN1H1 = function (data) {
	this.midScanLineJIT();
	this.window1Renderer.WINXCoordLeft = data;
}
GameBoyAdvanceGraphics.prototype.writeWIN0V0 = function (data) {
	this.midScanLineJIT();
	this.window0Renderer.WINYCoordBottom = data;		//Window y-coord goes up to this minus 1.
}
GameBoyAdvanceGraphics.prototype.writeWIN0V1 = function (data) {
	this.midScanLineJIT();
	this.window0Renderer.WINYCoordTop = data;
}
GameBoyAdvanceGraphics.prototype.writeWIN1V0 = function (data) {
	this.midScanLineJIT();
	this.window1Renderer.WINYCoordBottom = data;		//Window y-coord goes up to this minus 1.
}
GameBoyAdvanceGraphics.prototype.writeWIN1V1 = function (data) {
	this.midScanLineJIT();
	this.window1Renderer.WINYCoordTop = data;
}
GameBoyAdvanceGraphics.prototype.writeWININ0 = function (data) {
	//Window 0:
	this.midScanLineJIT();
	this.window0Renderer.WINBG0 = ((data & 0x01) == 0x01);
	this.window0Renderer.WINBG1 = ((data & 0x02) == 0x02);
	this.window0Renderer.WINBG2 = ((data & 0x04) == 0x04);
	this.window0Renderer.WINBG3 = ((data & 0x08) == 0x08);
	this.window0Renderer.WINOBJ = ((data & 0x10) == 0x10);
	this.window0Renderer.WINEffects = ((data & 0x20) == 0x20);
	this.window0Renderer.preprocess();
}
GameBoyAdvanceGraphics.prototype.readWININ0 = function () {
	//Window 0:
	return ((this.window0Renderer.WINBG0 ? 0x1 : 0) |
	(this.window0Renderer.WINBG1 ? 0x2 : 0) |
	(this.window0Renderer.WINBG2 ? 0x4 : 0) |
	(this.window0Renderer.WINBG3 ? 0x8 : 0) |
	(this.window0Renderer.WINOBJ ? 0x10 : 0) |
	(this.window0Renderer.WINEffects ? 0x20 : 0));
}
GameBoyAdvanceGraphics.prototype.writeWININ1 = function (data) {
	//Window 1:
	this.midScanLineJIT();
	this.window1Renderer.WINBG0 = ((data & 0x01) == 0x01);
	this.window1Renderer.WINBG1 = ((data & 0x02) == 0x02);
	this.window1Renderer.WINBG2 = ((data & 0x04) == 0x04);
	this.window1Renderer.WINBG3 = ((data & 0x08) == 0x08);
	this.window1Renderer.WINOBJ = ((data & 0x10) == 0x10);
	this.window1Renderer.WINEffects = ((data & 0x20) == 0x20);
	this.window1Renderer.preprocess();
}
GameBoyAdvanceGraphics.prototype.readWININ1 = function () {
	//Window 1:
	return ((this.window1Renderer.WINBG0 ? 0x1 : 0) |
	(this.windowRrenderer.WINBG1 ? 0x2 : 0) |
	(this.windowRrenderer.WINBG2 ? 0x4 : 0) |
	(this.windowRrenderer.WINBG3 ? 0x8 : 0) |
	(this.windowRrenderer.WINOBJ ? 0x10 : 0) |
	(this.windowRrenderer.WINEffects ? 0x20 : 0));
}
GameBoyAdvanceGraphics.prototype.writeWINOUT0 = function (data) {
	this.midScanLineJIT();
	this.WINBG0Outside = ((data & 0x01) == 0x01);
	this.WINBG1Outside = ((data & 0x02) == 0x02);
	this.WINBG2Outside = ((data & 0x04) == 0x04);
	this.WINBG3Outside = ((data & 0x08) == 0x08);
	this.WINOBJOutside = ((data & 0x10) == 0x10);
	this.WINEffectsOutside = ((data & 0x20) == 0x20);
	this.compositorPreprocess();
}
GameBoyAdvanceGraphics.prototype.readWINOUT0 = function () {
	return ((this.WINBG0Outside ? 0x1 : 0) |
	(this.WINBG1Outside ? 0x2 : 0) |
	(this.WINBG2Outside ? 0x4 : 0) |
	(this.WINBG3Outside ? 0x8 : 0) |
	(this.WINOBJOutside ? 0x10 : 0) |
	(this.WINEffectsOutside ? 0x20 : 0));
}
GameBoyAdvanceGraphics.prototype.writeWINOUT1 = function (data) {
	this.midScanLineJIT();
	this.WINOBJBG0Outside = ((data & 0x01) == 0x01);
	this.WINOBJBG1Outside = ((data & 0x02) == 0x02);
	this.WINOBJBG2Outside = ((data & 0x04) == 0x04);
	this.WINOBJBG3Outside = ((data & 0x08) == 0x08);
	this.WINOBJOBJOutside = ((data & 0x10) == 0x10);
	this.WINOBJEffectsOutside = ((data & 0x20) == 0x20);
	this.objWindowRenderer.preprocess();
}
GameBoyAdvanceGraphics.prototype.readWINOUT1 = function () {
	return ((this.WINOBJBG0Outside ? 0x1 : 0) |
	(this.WINOBJBG1Outside ? 0x2 : 0) |
	(this.WINOBJBG2Outside ? 0x4 : 0) |
	(this.WINOBJBG3Outside ? 0x8 : 0) |
	(this.WINOBJOBJOutside ? 0x10 : 0) |
	(this.WINOBJEffectsOutside ? 0x20 : 0));
}
GameBoyAdvanceGraphics.prototype.writeMOSAIC0 = function (data) {
	this.midScanLineJIT();
	this.BGMosaicHSize = data & 0xF;
	this.BGMosaicVSize = data >> 4;
}
GameBoyAdvanceGraphics.prototype.writeMOSAIC1 = function (data) {
	this.midScanLineJIT();
	this.OBJMosaicHSize = data & 0xF;
	this.OBJMosaicVSize = data >> 4;
}
GameBoyAdvanceGraphics.prototype.writeBLDCNT0 = function (data) {
	//Select target 1 and color effects mode:
	this.midScanLineJIT();
	this.effectsTarget1 = (data & 0x3F) << 16;
	this.colorEffectsType = data >> 6;
}
GameBoyAdvanceGraphics.prototype.readBLDCNT0 = function () {
	return (this.effectsTarget1 >> 16) | (this.colorEffectsType << 6);
}
GameBoyAdvanceGraphics.prototype.writeBLDCNT1 = function (data) {
	//Select target 2:
	this.midScanLineJIT();
	this.effectsTarget2 = (data & 0x3F) << 16;
}
GameBoyAdvanceGraphics.prototype.readBLDCNT1 = function () {
	return this.effectsTarget2 >> 16;
}
GameBoyAdvanceGraphics.prototype.writeBLDALPHA0 = function (data) {
	this.midScanLineJIT();
	this.alphaBlendAmountTarget1 = Math.min((data & 0x1F) / 0x10, 1);
}
GameBoyAdvanceGraphics.prototype.writeBLDALPHA1 = function (data) {
	this.midScanLineJIT();
	this.alphaBlendAmountTarget2 = Math.min((data & 0x1F) / 0x10, 1);
}
GameBoyAdvanceGraphics.prototype.writeBLDY = function (data) {
	this.midScanLineJIT();
	this.brightnessEffectAmount = Math.min((data & 0x1F) / 0x10, 1);
}
GameBoyAdvanceGraphics.prototype.writeVRAM = function (address, data) {
	this.midScanLineJIT();
	this.VRAM[address] = data;
}
GameBoyAdvanceGraphics.prototype.readVRAM = function (address) {
	return this.VRAM[address];
}
GameBoyAdvanceGraphics.prototype.writeOAM = function (address, data) {
	this.midScanLineJIT();
	var OAMTable = this.OAMTable[address >> 3];
	switch (address & 0x7) {
		//Attrib 0:
		case 0:
			OAMTable.ycoord = data;
			break;
		case 1:
			OAMTable.matrix2D = ((data & 0x1) == 0x1);
			OAMTable.doubleSizeOrDisabled = ((data & 0x2) == 0x2);
			OAMTable.mode = (data >> 2) & 0x3;
			OAMTable.mosaic = ((data & 0x10) == 0x10);
			OAMTable.monolithicPalette = ((data & 0x20) == 0x20);
			OAMTable.shape = data >> 6;
			break;
		//Attrib 1:
		case 2:
			OAMTable.xcoord = (OAMTable.xcoord & 0x100) | data;
			break;
		case 3:
			OAMTable.xcoord = ((data & 0x1) << 8) | (OAMTable.xcoord & 0xFF);
			OAMTable.matrixParameters = (data >> 1) & 0x1F;
			OAMTable.horizontalFlip = ((data & 0x10) == 0x10);
			OAMTable.verticalFlip = ((data & 0x20) == 0x20);
			OAMTable.size = data >> 6;
			break;
		//Attrib 2:
		case 4:
			OAMTable.tileNumber = (OAMTable.tileNumber & 0x300) | data;
			break;
		case 5:
			OAMTable.tileNumber = ((data & 0x3) << 8) | (OAMTable.tileNumber & 0xFF);
			OAMTable.priority = (data >> 2) & 0x3;
			OAMTable.paletteNumber = data >> 4;
			break;
		//Scaling/Rotation Parameter:
		case 6:
			this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] &= 0xFF00;
			this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] |= data;
			this.OBJMatrixParameters[address >> 5][(address >> 3) & 0x3] = (this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] << 16) / 0x1000000;
			break;
		default:
			this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] &= 0x00FF;
			this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] |= data << 8;
			this.OBJMatrixParameters[address >> 5][(address >> 3) & 0x3] = (this.OBJMatrixParametersRaw[address >> 5][(address >> 3) & 0x3] << 16) / 0x1000000;
	}
	this.OAMRAM[address] = data;
}
GameBoyAdvanceGraphics.prototype.readOAM = function (address) {
	return this.OAMRAM[address];
}
GameBoyAdvanceGraphics.prototype.writePalette = function (address, data) {
	this.midScanLineJIT();
	this.paletteRAM[address] = data;
	var palette = ((this.paletteRAM[address | 1] << 8) | this.paletteRAM[address & 0x3FE]) & 0x7FFF;
	address >>= 1;
	if ((address & 0xFF) == 0) {
		palette |= this.transparency;
        if (address == 0) {
            this.backdrop = palette;
        }
	}
	if (address < 0x100) {
		this.palette256[address] = palette;
	}
	else {
		this.paletteOBJ256[address & 0xFF] = palette;
	}
	if ((address & 0xF) == 0) {
		palette |= this.transparency;
	}
	if (address < 0x100) {
		this.palette16[address >> 4][address & 0xF] = palette;
	}
	else {
		this.paletteOBJ16[(address >> 4) & 0xF][address & 0xF] = palette;
	}
}
GameBoyAdvanceGraphics.prototype.readPalette = function (address) {
	return this.paletteRAM[address];
}