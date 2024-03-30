"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fontSize = 16;
const stroke = {
    type: 'SOLID',
    color: { r: 0.7, g: 0.7, b: 0.7 }
};
figma.showUI(__html__, { height: 300, width: 300 });
figma.ui.onmessage = (msg) => {
    if (msg.type === "get-collections") {
        figma.variables.getLocalVariableCollectionsAsync().then((localCollections) => {
            const collections = [];
            for (const collection of localCollections) {
                collections.push(collection.name);
            }
            figma.ui.postMessage({
                type: "get-collections",
                body: collections
            });
        });
    }
    if (msg.type === "append-inspection-frame") {
        CleanUpInspectionFramesWrapper();
        GetCollectionId(msg.collection).then((collectionId) => {
            AppendInspectionFramesWrapper(collectionId);
        });
    }
    if (msg.type === "cancel") {
        figma.closePlugin();
    }
};
figma.on("close", CleanUpInspectionFramesWrapper);
function AppendInspectionFramesWrapper(collectionId) {
    const currentPage = figma.currentPage;
    // Iterate through all the layers in the current page
    for (const layer of currentPage.children) {
        if (layer.type === 'FRAME') {
            AppendInspectionFrames(layer, collectionId);
        }
        if (layer.type === "SECTION") {
            for (const sectionChild of layer.children) {
                if (sectionChild.type === 'FRAME') {
                    AppendInspectionFrames(sectionChild, collectionId);
                }
            }
        }
    }
}
function AppendInspectionFrames(layer, collectionId) {
    const inspectorFrame = figma.createFrame();
    layer.appendChild(inspectorFrame);
    if (layer.layoutMode !== "NONE") {
        inspectorFrame.layoutPositioning = "ABSOLUTE";
    }
    setInspectorFrameProperties(inspectorFrame, layer);
    figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(() => __awaiter(this, void 0, void 0, function* () {
        const title = figma.createText();
        title.fontName = { family: "Inter", style: "Regular" };
        title.fontSize = fontSize;
        title.characters = "Inspector";
        inspectorFrame.appendChild(title);
        title.layoutSizingHorizontal = "FILL";
        // Container for variables array
        const variablesFrame = figma.createFrame();
        inspectorFrame.appendChild(variablesFrame);
        variablesFrame.name = "VariablesFrame";
        variablesFrame.layoutMode = "VERTICAL";
        variablesFrame.layoutSizingHorizontal = "FILL";
        variablesFrame.layoutSizingVertical = "HUG";
        figma.variables.getLocalVariablesAsync().then((localVariables) => {
            for (const variable of localVariables) {
                if ((variable.resolvedType === "STRING") && (variable.variableCollectionId === collectionId)) {
                    // Container for a single variable
                    const variableFrame = figma.createFrame();
                    variablesFrame.appendChild(variableFrame);
                    SetVariableFrameProperties(variableFrame);
                    // Variable name
                    const name = figma.createText();
                    variableFrame.appendChild(name);
                    name.characters = `${variable.name}:`;
                    // Variable value
                    const value = figma.createText();
                    variableFrame.appendChild(value);
                    value.setBoundVariable("characters", variable);
                }
                if ((variable.resolvedType === "BOOLEAN") && (variable.variableCollectionId === collectionId)) {
                    // Container for a single variable
                    const variableFrame = figma.createFrame();
                    variablesFrame.appendChild(variableFrame);
                    SetVariableFrameProperties(variableFrame);
                    // Variable name
                    const name = figma.createText();
                    variableFrame.appendChild(name);
                    name.characters = `${variable.name}:`;
                    // Variable truthy value show or hide
                    const truthy = figma.createText();
                    variableFrame.appendChild(truthy);
                    truthy.characters = "true";
                    truthy.setBoundVariable("visible", variable);
                }
            }
        });
    }));
}
function CleanUpInspectionFramesWrapper() {
    const currentPage = figma.currentPage;
    // Iterate through all the layers in the current page
    for (const layer of currentPage.children) {
        if (layer.type === 'FRAME') {
            CleanUpInspectionFrames(layer);
        }
        if (layer.type === "SECTION") {
            for (const sectionChild of layer.children) {
                if (sectionChild.type === 'FRAME') {
                    CleanUpInspectionFrames(sectionChild);
                }
            }
        }
    }
}
function CleanUpInspectionFrames(layer) {
    // Iterate through all the children of the parent frame
    layer.children.forEach(child => {
        // Check if the child is the frame previously appended by name
        if (child.type === 'FRAME' && child.name === 'InspectorFrame') {
            // Remove the child frame
            child.remove();
        }
    });
}
function setInspectorFrameProperties(inspectorFrame, layer) {
    inspectorFrame.name = 'InspectorFrame';
    inspectorFrame.resize((layer.width * 0.25), (layer.height * 0.25));
    inspectorFrame.layoutMode = "VERTICAL";
    inspectorFrame.horizontalPadding = 4;
    inspectorFrame.verticalPadding = 4;
    inspectorFrame.itemSpacing = 4;
    inspectorFrame.overflowDirection = "BOTH";
    inspectorFrame.layoutSizingVertical = "HUG";
    inspectorFrame.layoutSizingHorizontal = "HUG";
    inspectorFrame.maxWidth = layer.width * 0.25;
    inspectorFrame.maxHeight = layer.height * 0.25;
    inspectorFrame.cornerRadius = 4;
    inspectorFrame.effects = [{
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            radius: 4,
            spread: 0,
            visible: true,
            blendMode: "PASS_THROUGH"
        }];
}
function SetTextProperties(textNode, textContent) {
    textNode.fontName = { family: "Inter", style: "Regular" };
    textNode.fontSize = fontSize;
    textNode.characters = textContent;
}
function SetVariableFrameProperties(variableFrame) {
    variableFrame.name = "VariableFrame";
    variableFrame.layoutMode = "HORIZONTAL";
    variableFrame.layoutWrap = "WRAP";
    variableFrame.layoutSizingHorizontal = "FILL";
    variableFrame.layoutSizingVertical = "HUG";
    variableFrame.strokes = [stroke];
    variableFrame.strokeWeight = 1;
    variableFrame.strokeAlign = 'OUTSIDE';
}
function GetCollectionId(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        const localCollections = yield figma.variables.getLocalVariableCollectionsAsync();
        for (const collection of localCollections) {
            if (collection.name === collectionName) {
                return collection.id; // Return the collection ID directly when found
            }
        }
        return "";
    });
}
