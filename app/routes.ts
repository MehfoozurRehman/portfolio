import { type RouteConfig } from "@react-router/dev/routes";
import { nextRoutes } from "rr-next-routes/react-router";

const routes = nextRoutes({ print: "info", folderName: "screens" });

export default routes satisfies RouteConfig;
