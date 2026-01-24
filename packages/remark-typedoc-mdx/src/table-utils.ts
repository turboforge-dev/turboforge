import type {
  Heading,
  Parent,
  PhrasingContent,
  RootContent,
  Table,
  TableRow,
} from "mdast";
import { extractText } from "./utils";

const SECTIONS = ["Parameters", "Returns"];

export const convertToTable = (
  node: Heading,
  index: number,
  parent: Parent,
) => {
  const title = extractText(node).trim();
  if (!SECTIONS.includes(title)) return;

  // 2. Isolate the Section (e.g., everything inside ## Parameters)
  const siblings = parent.children;
  let endIndex = siblings.length;
  for (let i = index + 1; i < siblings.length; i++) {
    if (siblings[i].type === "heading" && (siblings[i] as Heading).depth <= 2) {
      endIndex = i;
      break;
    }
  }

  const sectionNodes = siblings.slice(index + 1, endIndex);

  if (title === "Parameters") {
    // 3. Process the Section based on type
    const processed = processParametersSection(sectionNodes);
    parent.children.splice(index + 1, sectionNodes.length, ...processed);
  } else if (title === "Returns") {
    const processed = processReturnsSection(sectionNodes);
    parent.children.splice(index + 1, sectionNodes.length, ...processed);
  }
};

/**
 * Handles ## Parameters
 * Group by H3 (Args). If H3 has H4 children (Properties), turn H4s into a Table.
 */
const processParametersSection = (nodes: RootContent[]): RootContent[] => {
  const groups = groupNodesByHeading(nodes, 3);
  const result: RootContent[] = [];

  for (const group of groups) {
    // Add the H3 Header and any direct description
    result.push(group.heading);
    result.push(...group.contentBeforeNextLevel);

    // Check if this Argument has sub-properties (H4s)
    const propertyGroups = groupNodesByHeading(group.children, 4);

    if (propertyGroups.length > 0) {
      // It's a complex object -> Create a Table
      const table = createTableFromGroups(propertyGroups);
      result.push(table);
    } else {
      // It's a simple argument -> Just keep the description/type (already added above)
      result.push(...group.children);
    }
  }

  // If there were no H3s (edge case), return original
  return groups.length > 0 ? result : nodes;
};

/**
 * Handles ## Returns
 * Group by H3 (Methods/Fields).
 * Inside H3: Look for "#### Parameters" -> Convert H5s to Table.
 */
const processReturnsSection = (nodes: RootContent[]): RootContent[] => {
  const groups = groupNodesByHeading(nodes, 3);
  const result: RootContent[] = [];

  // If no H3s exist, it's likely a simple return type (e.g. just `object`)
  if (groups.length === 0) return nodes;

  for (const group of groups) {
    result.push(group.heading);
    result.push(...group.contentBeforeNextLevel); // Descriptions of the method

    // Analyze the internal structure of the method (H4s)
    const subSections = groupNodesByHeading(group.children, 4);

    for (const sub of subSections) {
      const subTitle = extractText(sub.heading).trim();

      if (subTitle === "Parameters") {
        // Keep the "Parameters" header? Users usually prefer it removed if replacing with table,
        // but prompt requested "#### Parameters --- Parameters Table". We keep the H4.
        result.push(sub.heading);

        // Convert H5 children to Table
        const paramArgs = groupNodesByHeading(sub.children, 5);
        if (paramArgs.length > 0) {
          result.push(createTableFromGroups(paramArgs));
        } else {
          result.push(...sub.children);
        }
      } else {
        // "Returns" or other H4s -> Keep as is
        result.push(sub.heading);
        result.push(...sub.children);
      }
    }
  }

  return result;
};

// --- Utilities ---

interface HeadingGroup {
  heading: Heading;
  contentBeforeNextLevel: RootContent[]; // Direct description before sub-headers
  children: RootContent[]; // Nodes belonging to this header (including sub-headers)
}

/**
 * Groups a flat list of nodes by a specific heading depth.
 * Example: Input [H3, P, H4, P, H3, P] with depth 3 -> Returns 2 Groups.
 */
const groupNodesByHeading = (
  nodes: RootContent[],
  depth: number,
): HeadingGroup[] => {
  const groups: HeadingGroup[] = [];
  let currentGroup: HeadingGroup | null = null;
  let inSubContent = false;

  for (const node of nodes) {
    if (node.type === "heading" && node.depth === depth) {
      currentGroup = {
        heading: node,
        contentBeforeNextLevel: [],
        children: [],
      };
      groups.push(currentGroup);
      inSubContent = false;
    } else if (currentGroup) {
      // If we hit a deeper heading, we are now in the 'children' zone
      if (node.type === "heading" && node.depth > depth) {
        inSubContent = true;
      }

      if (inSubContent || node.type === "heading") {
        currentGroup.children.push(node);
      } else {
        // It's a direct description of the current heading
        currentGroup.contentBeforeNextLevel.push(node);
      }
    }
  }
  return groups;
};

/**
 * Converts Heading Groups (e.g., H4 'level' + P 'Type') into Table Rows
 */
const createTableFromGroups = (groups: HeadingGroup[]): Table => {
  const rows: TableRow[] = [];

  // Header
  rows.push({
    type: "tableRow",
    children: [
      { type: "tableCell", children: [{ type: "text", value: "Name" }] },
      { type: "tableCell", children: [{ type: "text", value: "Type" }] },
      { type: "tableCell", children: [{ type: "text", value: "Description" }] },
    ],
  });

  for (const group of groups) {
    const name = extractText(group.heading).trim().replace(/[?]/g, ""); // Clean optional markers if desired
    const isOptional = extractText(group.heading).includes("?");

    // Extract Type and Description
    // Heuristic: First paragraph usually contains the type (often linked or code), rest is description
    let typeNodes: PhrasingContent[] = [{ type: "text", value: "-" }];
    const descNodes: PhrasingContent[] = [];

    const content = [...group.contentBeforeNextLevel, ...group.children]; // Flatten for cell content

    // Filter out empty nodes/newlines
    const validContent = content.filter(
      (n) => n.type !== "text" || n.value.trim() !== "",
    );

    if (validContent.length > 0) {
      // The first node is often the type in TypeDoc standard output
      const first = validContent[0];
      if (first.type === "paragraph") {
        typeNodes = first.children;
        // The rest of the nodes are description
        if (validContent.length > 1) {
          // We need to flatten block nodes into phrasing content for the table cell
          // or just take the first description paragraph
          const desc = validContent.slice(1);
          desc.forEach((d) => {
            if ((d as Parent).children)
              descNodes.push(...((d as Parent).children as PhrasingContent[]), {
                type: "text",
                value: " ",
              });
          });
        }
      }
    }

    // Format Name (Bold if required, code style usually looks best)
    const nameCellChildren: PhrasingContent[] = [
      { type: "inlineCode", value: name + (isOptional ? "?" : "") },
    ];

    rows.push({
      type: "tableRow",
      children: [
        { type: "tableCell", children: nameCellChildren },
        { type: "tableCell", children: typeNodes },
        {
          type: "tableCell",
          children: descNodes.length
            ? descNodes
            : [{ type: "text", value: "-" }],
        },
      ],
    });
  }

  return {
    type: "table",
    align: ["left", "left", "left"],
    children: rows,
  };
};
