// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

const fontSize = 16;
let doesNumberTypeVariableExist = false
let doesColorTypeVariableExist = false
const stroke: Paint = {
  type: 'SOLID',
  color: { r: 0.7, g: 0.7, b: 0.7 }
};


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string, count: number }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // if (msg.type === "get-variables") {
  //   figma.on("selectionchange", () => {
  //     const selectedFrame = figma.currentPage.selection[0]
  //     if (selectedFrame && selectedFrame.type === "FRAME") {
  //       console.log(selectedFrame)
  //       AppendInspectionFrames().then((variables: any) => {
  //         figma.ui.postMessage(variables)
  //       })
  //     }
  //     else
  //       figma.notify("Please select a frame")
  //   })
  // }

  if (msg.type === "append-inspection-frame") {
    figma.variables.getLocalVariablesAsync().then((localVariables) => {
      AppendInspectionFrames(localVariables)
    })

  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

figma.on("close", CleanUpInspectionFrames)

async function AppendInspectionFrames(localVariables: Variable[]) {
  const currentPage = figma.currentPage;

  // Iterate through all the layers in the current page
  for (const layer of currentPage.children) {
    if (layer.type === 'FRAME') {
      const inspectorFrame = figma.createFrame();
      layer.appendChild(inspectorFrame);
      if (layer.layoutMode !== "NONE") {
        inspectorFrame.layoutPositioning = "ABSOLUTE"
      }
      setInspectorProps(inspectorFrame, layer)


      figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(async () => {
        const title = figma.createText()
        title.fontName = { family: "Inter", style: "Regular" }
        title.fontSize = fontSize
        title.characters = "Variables Inspector"
        inspectorFrame.appendChild(title)
        title.layoutSizingHorizontal = "FILL"

        const variablesFrame = figma.createFrame()
        inspectorFrame.appendChild(variablesFrame)
        variablesFrame.name = "VariablesFrame"
        variablesFrame.layoutMode = "VERTICAL"
        variablesFrame.layoutSizingHorizontal = "FILL"
        variablesFrame.layoutSizingVertical = "HUG"

        for (const variable of localVariables) {
          if ((variable.resolvedType === "STRING")) {
            const variableFrame = figma.createFrame()
            variablesFrame.appendChild(variableFrame)
            SetVariableFrameProperties(variableFrame)

            const name = figma.createText()
            variableFrame.appendChild(name)
            name.characters = `${variable.name}:`

            const value = figma.createText()
            variableFrame.appendChild(value)
            value.setBoundVariable("characters", variable)
          }

          if ((variable.resolvedType === "BOOLEAN")) {
            const variableFrame = figma.createFrame()
            variablesFrame.appendChild(variableFrame)
            SetVariableFrameProperties(variableFrame)

            const name = figma.createText()
            variableFrame.appendChild(name)
            name.characters = `${variable.name}:`

            const truthy = figma.createText()
            variableFrame.appendChild(truthy)
            truthy.characters = "true"
            truthy.setBoundVariable("visible", variable)
          }

          if (variable.resolvedType === "FLOAT")
            doesNumberTypeVariableExist = true
          if (variable.resolvedType === "COLOR")
            doesColorTypeVariableExist = true
        }
      })
    }
  }
  setTimeout(() => {
    if (doesNumberTypeVariableExist === true)
      figma.notify("Number type variables cannot be inspected due to Figma limitations")
    if (doesColorTypeVariableExist === true)
      figma.notify("Color type variables are currently not supported")
  }, 1000);
}

async function CleanUpInspectionFrames() {
  const currentPage = figma.currentPage;

  // Iterate through all the layers in the current page
  currentPage.children.forEach(layer => {
    // Check if the layer is a frame
    if (layer.type === 'FRAME') {

      // Iterate through all the children of the parent frame
      layer.children.forEach(child => {
        // Check if the child is the frame previously appended by name
        if (child.type === 'FRAME' && child.name === 'InspectorFrame') {
          // Remove the child frame
          child.remove()
        }
      });
    }
  });
}

async function setInspectorProps(inspectorFrame: FrameNode, layer: FrameNode) {
  inspectorFrame.name = 'InspectorFrame' // Set the name of the frame
  inspectorFrame.resize((layer.width * 0.25), (layer.height * 0.25)); // Resize the child frame
  inspectorFrame.layoutMode = "VERTICAL"
  inspectorFrame.horizontalPadding = 4
  inspectorFrame.verticalPadding = 4
  inspectorFrame.itemSpacing = 4
  inspectorFrame.overflowDirection = "BOTH";
  inspectorFrame.layoutSizingVertical = "HUG"
  inspectorFrame.layoutSizingHorizontal = "HUG"
  inspectorFrame.maxWidth = layer.width * 0.25
  inspectorFrame.maxHeight = layer.height * 0.25
  inspectorFrame.cornerRadius = 4
  inspectorFrame.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 4 },
    radius: 4,
    spread: 0,
    visible: true,
    blendMode: "PASS_THROUGH"
  }]
}

async function SetTextProperties(textNode: TextNode, textContent: string) {
  textNode.fontName = { family: "Inter", style: "Regular" }
  textNode.fontSize = fontSize
  textNode.characters = textContent
}

function SetVariableFrameProperties(variableFrame: FrameNode) {
  variableFrame.name = "VariableFrame"
  variableFrame.layoutMode = "HORIZONTAL"
  variableFrame.layoutWrap = "WRAP"
  variableFrame.layoutSizingHorizontal = "FILL"
  variableFrame.layoutSizingVertical = "HUG"
  variableFrame.strokes = [stroke];
  variableFrame.strokeWeight = 1; // 1px stroke width
  variableFrame.strokeAlign = 'OUTSIDE';
}

