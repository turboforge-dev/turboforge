import type { NodePlopAPI } from "plop";
import { componentGenerator } from "./component";
import { exampleGenerator } from "./example";
import { hookGenerator } from "./hook";
import { packageGenerator } from "./package";

export const plopUtilsRef: {
  toKebabPath: (text: string) => string;
} = {
  toKebabPath: () => "",
};

export default async (plop: NodePlopAPI) => {
  plop.setWelcomeMessage(
    "Welcome to the Turbo Forge generator! What would you like to create?",
  );
  plop.setHelper(
    "scopedKebab",
    (text) =>
      (text.startsWith("@") ? "@" : "") +
      text.split(/\/|\\/).map(plop.getHelper("kebabCase")).join("/"),
  );
  plopUtilsRef.toKebabPath = plop.getHelper("scopedKebab") as (
    text: string,
  ) => string;
  plop.setGenerator("rc", componentGenerator);
  plop.setGenerator("hook", hookGenerator);
  plop.setGenerator("pkg", packageGenerator);
  plop.setGenerator("exp", exampleGenerator);
};
