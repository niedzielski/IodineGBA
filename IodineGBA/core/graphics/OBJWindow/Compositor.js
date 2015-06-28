"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceOBJWindowCompositor(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceOBJWindowCompositor.prototype.initialize = function () {
    this.colorEffectsRenderer = this.gfx.colorEffectsRenderer;
    this.OBJWindowBuffer = this.gfx.objRenderer.scratchWindowBuffer;
}
GameBoyAdvanceOBJWindowCompositor.prototype.preprocess = function (doEffects) {
    doEffects = doEffects | 0;
    if ((doEffects | 0) != 0) {
        this.renderScanLine = this.renderScanLineWithEffects;
    }
    else {
        this.renderScanLine = this.renderNormalScanLine;
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.cleanLayerStack = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
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
GameBoyAdvanceOBJWindowCompositor.prototype.renderNormalScanLine = function (lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    switch (layerStack.length) {
        case 0:
            this.fillWithBackdrop(lineBuffer);
            break;
        case 1:
            this.composite1Layer(lineBuffer, layerStack[0]);
            break;
        case 2:
            this.composite2Layer(lineBuffer, layerStack[0], layerStack[1]);
            break;
        case 3:
            this.composite3Layer(lineBuffer, layerStack[0], layerStack[1], layerStack[2]);
            break;
        case 4:
            this.composite4Layer(lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3]);
            break;
        case 5:
            this.composite5Layer(lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3], layerStack[4]);
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.renderScanLineWithEffects = function (lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    switch (layerStack.length) {
        case 0:
            this.fillWithBackdropSpecial(lineBuffer);
            break;
        case 1:
            this.composite1LayerSpecial(lineBuffer, layerStack[0]);
            break;
        case 2:
            this.composite2LayerSpecial(lineBuffer, layerStack[0], layerStack[1]);
            break;
        case 3:
            this.composite3LayerSpecial(lineBuffer, layerStack[0], layerStack[1], layerStack[2]);
            break;
        case 4:
            this.composite4LayerSpecial(lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3]);
            break;
        case 5:
            this.composite5LayerSpecial(lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3], layerStack[4]);
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.fillWithBackdrop = function (lineBuffer) {
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lineBuffer[xStart | 0] = this.gfx.backdrop | 0;
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.fillWithBackdropSpecial = function (lineBuffer) {
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(0, this.gfx.backdrop | 0) | 0;
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite1Layer = function (lineBuffer, layer0) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite2Layer = function (lineBuffer, layer0, layer1) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite3Layer = function (lineBuffer, layer0, layer1, layer2) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite4Layer = function (lineBuffer, layer0, layer1, layer2, layer3) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer3[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite5Layer = function (lineBuffer, layer0, layer1, layer2, layer3, layer4) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer3[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer4[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite1LayerSpecial = function (lineBuffer, layer0) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite2LayerSpecial = function (lineBuffer, layer0, layer1) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite3LayerSpecial = function (lineBuffer, layer0, layer1, layer2) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite4LayerSpecial = function (lineBuffer, layer0, layer1, layer2, layer3) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer3[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite5LayerSpecial = function (lineBuffer, layer0, layer1, layer2, layer3, layer4) {
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = layer0[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer1[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer2[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer3[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = layer4[xStart | 0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}