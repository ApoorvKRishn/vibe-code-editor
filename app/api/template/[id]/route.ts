import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

function getFallbackTemplate(): { folderName: string; items: Array<{ filename: string; fileExtension: string; content: string } | { folderName: string; items: Array<{ filename: string; fileExtension: string; content: string }> }> } {
  return {
    folderName: "react-ts",
    items: [
      {
        filename: "package",
        fileExtension: "json",
        content: JSON.stringify({
          scripts: {
            start: "vite --host 0.0.0.0",
            dev: "vite --host 0.0.0.0",
          },
          dependencies: {
            "@vitejs/plugin-react": "latest",
            vite: "latest",
            react: "latest",
            "react-dom": "latest",
          },
          devDependencies: {},
        }, null, 2),
      },
      {
        filename: "index",
        fileExtension: "html",
        content: '<div id="root"></div><script type="module" src="/src/main.jsx"></script>',
      },
      {
        folderName: "src",
        items: [
          {
            filename: "main",
            fileExtension: "jsx",
            content: 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport "./style.css";\n\nfunction App() {\n  return <main><h1>Vibecode starter</h1><p>Your playground is ready.</p></main>;\n}\n\ncreateRoot(document.getElementById("root")).render(<App />);',
          },
          {
            filename: "style",
            fileExtension: "css",
            content: "body { margin: 0; font-family: system-ui, sans-serif; } main { padding: 3rem; }",
          },
        ],
      },
    ],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

const {id} = await params;

if(!id){
      return Response.json({ error: "Missing playground ID" }, { status: 400 });
}

const playground = await db.playground.findUnique({
    where:{id}
})

  if (!playground) {
    return Response.json({ error: "Playground not found" }, { status: 404 });
  }
  
  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey]

    if (!templatePath) {
    return Response.json({ error: "Invalid template" }, { status: 404 });
  }

    const inputPath = path.join(process.cwd(), templatePath);
    try {
      await fs.access(inputPath);
    } catch {
      return Response.json({ success: true, templateJson: getFallbackTemplate() });
    }

  try {
    const outputFile = path.join(process.cwd() , `output/${templateKey}.json`);

    await saveTemplateStructureToJson(inputPath , outputFile);
    const result = await readTemplateStructureFromJson(outputFile);


    // Validate the JSON structure before saving
    if (!validateJsonStructure(result.items)) {
      return Response.json({ error: "Invalid JSON structure" }, { status: 500 });
    }

    await fs.unlink(outputFile)


      return Response.json({ success: true, templateJson: result }, { status: 200 });
  } catch (error) {
      console.error("Error generating template JSON:", error);
    return Response.json({ error: "Failed to generate template" }, { status: 500 });
  }


}
