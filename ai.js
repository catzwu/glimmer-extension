// AI-related functionality
let hasClaudeKey = false;

/**
 * Generates AI flashcards from highlights
 * @param {Array} highlights - The current highlights
 * @returns {Promise<Array>} - The generated flashcards
 */
async function generateAIFlashcards(highlights) {
  // Save Claude API key if provided
  const claudeKey = document.getElementById("claude-api-key").value.trim();
  if (claudeKey) {
    await chrome.storage.local.set({ claudeApiKey: claudeKey });
    hasClaudeKey = true;
  }

  // Generate flashcards for each highlight
  const aiCards = [];
  for (const highlight of highlights) {
    const cards = await generateFlashcard(highlight.text, highlight.context);
    aiCards.push(...cards);
  }

  return aiCards;
}

/**
 * Generates a flashcard using Claude API
 * @param {string} text - The highlighted text
 * @param {string} context - The surrounding context
 * @returns {Promise<Array<string>>} - The generated flashcard
 */
async function generateFlashcard(text, context) {
  const claudeKey = document.getElementById("claude-api-key").value;
  if (!claudeKey) {
    const apiKeysSection = document.querySelector(".api-keys-section");
    apiKeysSection.style.display = "block";
    throw new Error("Please enter your Claude API key");
  }

  const prompt =
    'Transform the provided text into atomic flashcards that optimize learning through spaced repetition. Each flashcard should:\nFront Side Requirements\n\nAsk a single, specific question\nFocus on understanding rather than pure memorization\nUse clear, unambiguous language\nWhen appropriate, include relevant context without giving away the answer\nFor concepts requiring computation or problem-solving, ask for the process rather than just the result\n\nBack Side Requirements\nProvide a concise, focused answer that fully addresses the question, ideally no more than 10-15 words\nFor problem-solving questions, show the key steps in the solution\n\nFormatting Rules\nFor each flashcard, output in this format:\nQuestion\n---\nAnswer\n#Relevant topic tags for organization\nNote: [Optional - Any special study tips or mnemonics]\nProcessing Instructions\nWhen converting text into flashcards:\n\nBreak down complex ideas into multiple atomic cards\n\nEach card should test one specific fact or concept\nAvoid compound questions\nCreate separate cards for related but distinct ideas\n\n\nApply these transformation rules:\n\nConvert statements into questions that promote active recall\nRephrase to eliminate textbook-style language and shorten where possible\nRemove redundant questions or information\nAdd context when the original text assumes background knowledge\nCreate bidirectional cards for important relationships (A→B and B→A)\n\nApply these quality checks:\n\nDoes the card test understanding rather than recognition?\nIs the question clear without seeing the answer?\nCould someone familiar with the subject verify the answer\'s correctness?\nIs the card\'s scope appropriate (neither too broad nor too narrow)?\n\n\nExamples\nHere are three example transformations:\nOriginal text: "The mitochondria is the powerhouse of the cell, producing ATP through cellular respiration."\nBad card:\nWhat is the mitochondria?\n---\nThe powerhouse of the cell that produces ATP through cellular respiration.\nGood cards:\nThrough what process do mitochondria produce ATP?\n---\nCellular respiration\n#biology, #cellular-processes\n\nWhy are mitochondria often called the "powerhouse" of the cell?\n---\nThey produce ATP (energy) through cellular respiration, which powers most cellular processes\n#biology, #cellular-processes\nNote: Think of mitochondria as tiny power plants inside each cell\n\nOutput Format\nGenerate the flashcards in this structure:\n\nFirst, list all created flashcards in the specified format. Separate cards with *****.\nDo not say anything besides text that will appear in the flashcards\n\n\nQuality Guidelines\nEach flashcard must:\n\nFollow the minimum information principle (one fact per card)\nBe clear and unambiguous\nUse few words\nFocus on understanding over memorization\nBe self-contained (understand the question without external reference)\nAvoid sets/enumerations (break into individual cards)';

  const header = {
    "Content-Type": "application/json",
    "x-api-key": claudeKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": true,
  };
  const msg = {
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system:
      "You create perfect Anki flashcards, in accordance with the twenty rules of formulating knowledge",
    messages: [
      {
        role: "user",
        content: prompt + "\n\nText: " + text + "\nContext: " + context,
      },
    ],
  };
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: header,
    body: JSON.stringify(msg),
  });

  if (!response.ok) {
    const apiKeysSection = document.querySelector(".api-keys-section");
    apiKeysSection.style.display = "block";
    throw new Error("AI" + JSON.stringify(await response.json()));
  }

  const data = await response.json();
  const content = data.content[0].text;
  const cards = content.split("*****");
  return cards;
}

/**
 * Creates a preview element for an AI-generated flashcard
 * @param {Object} card - The flashcard data
 * @param {number} index - The card index
 * @param {Function} onDelete - Callback function when delete button is clicked
 * @returns {HTMLElement} - The preview element
 */
function createAIFlashcardPreview(card, index, onDelete) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "flashcard-preview";

  // Header with title and delete button
  const headerDiv = document.createElement("div");
  headerDiv.className = "card-header";

  const titleSpan = document.createElement("strong");
  titleSpan.textContent = `Card ${index + 1}`;
  headerDiv.appendChild(titleSpan);

  if (onDelete) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-highlight";
    deleteButton.innerHTML = "×";
    deleteButton.setAttribute("aria-label", "Delete card");
    deleteButton.onclick = () => onDelete(index);
    headerDiv.appendChild(deleteButton);
  }

  cardDiv.appendChild(headerDiv);

  // Card content
  const [front, back] = card.split("---");

  const frontDiv = document.createElement("div");
  frontDiv.className = "card-front";
  frontDiv.innerHTML = `${front}`;

  const backDiv = document.createElement("div");
  backDiv.className = "card-back";
  backDiv.innerHTML = `<div class="context">${back}</div>`;

  cardDiv.appendChild(frontDiv);
  cardDiv.appendChild(backDiv);
  return cardDiv;
}

/**
 * Initializes AI functionality
 */
async function initAI() {
  const result = await chrome.storage.local.get(["claudeApiKey"]);
  if (result.claudeApiKey) {
    document.getElementById("claude-api-key").value = result.claudeApiKey;
    hasClaudeKey = true;
  }
}

export { hasClaudeKey, generateAIFlashcards, createAIFlashcardPreview, initAI };
