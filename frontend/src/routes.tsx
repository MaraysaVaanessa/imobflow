import React from "react";

// Admin Imports
// Admin Imports
import MainDashboard from "views/admin/default";
import Properties from "views/admin/properties";
import Tenants from "views/admin/tenants";
import Owners from "views/admin/owners";
import Profile from "views/admin/profile";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import {
  MdHome,
  MdPerson,
  MdLock,
  MdApartment,
  MdGroups,
} from "react-icons/md";
const routes = [
  {
    name: "Main Dashboard",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },

  {
    name: "Imóveis",
    layout: "/admin",
    path: "properties",
    icon: <MdApartment className="h-6 w-6" />,
    component: <Properties />,
  },

  {
    name: "Proprietários",
    layout: "/admin",
    path: "owners",
    icon: <MdGroups className="h-6 w-6" />,
    component: <Owners />,
  },

  {
    name: "Inquilinos",
    layout: "/admin",
    path: "tenants",
    icon: <MdGroups className="h-6 w-6" />,
    component: <Tenants />,
  },

  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
];
export default routes;
