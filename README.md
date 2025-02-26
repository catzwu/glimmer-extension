An extension to save and remember what you read.

# Usage

In Chrome's extension settings, go into developer mode and "Load unpacked". Select the `build` folder. To update, rebuild with `npm run build` in the `extension` folder and refresh the extension.

When first using it, you will need to add an API key for both Claude and Mochi. Obsidian settings (i.e. which folder to add to) can be changed at any point.

The system prompt for flashcards generation and template for Obsidian note creation can be found in `AICardGenerator.tsx` and `MarkdownExporter.tsx`, respectively.

# Todo

- Add options for Anki and OpenAI
- Move API key saving into settings
- Allow users to edit prompts in settings

Fix known bugs:

- Sometimes highlights will get cleared. Need to figure out how to reproduce reliably
- Highlighting across paragraph breaks or other styling ruins the styling.
