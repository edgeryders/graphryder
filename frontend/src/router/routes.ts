import { Home } from "../components/home";
import { Dashboard } from "../components/dashboard";

// Definition of a route
export interface RouteDefinition {
  path: string;
  redirect?: string;
  component?: any;
  exact?: boolean;
  routes?: RouteDefinition[];
}

export const routes: RouteDefinition[] = [
  {
    path: "",
    redirect: "/",
    routes: [
      {
        path: "/",
        component: Home,
      },
      {
        path: "/dashboard/:platform/:corpus",
        exact: true,
        component: Dashboard,
      },
    ],
  },
];
