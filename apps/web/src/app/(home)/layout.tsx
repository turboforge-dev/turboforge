import { HomeLayout } from "fumadocs-ui/layouts/home";
import { RootProvider } from "fumadocs-ui/provider/next";
import { baseOptions } from "@/lib/layout.shared";

const Layout = ({ children }: LayoutProps<"/">) => (
  <RootProvider search={{ options: { type: "static" } }}>
    <HomeLayout {...baseOptions()}>{children}</HomeLayout>
  </RootProvider>
);

export default Layout;
