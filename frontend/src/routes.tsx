import React from "react";

// Admin Imports
// Admin Imports
import MainDashboard from "views/admin/default";
import Properties from "views/admin/properties";
import Tenants from "views/admin/tenants";
import Owners from "views/admin/owners";
import Profile from "views/admin/profile";
import Contracts from "views/admin/contracts";
import Payments from "views/admin/payments";
import Maintenances from "views/admin/maintenances";
import Appointments from "views/admin/appointments";
import Assistant from "views/admin/assistant";
import Reports from "views/admin/reports";
// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import {
  MdHome,
  MdPerson,
  MdLock,
  MdApartment,
  MdGroups,
  MdDescription,
  MdAttachMoney,
  MdBuild,
  MdEvent,
  MdAssessment,
  MdSmartToy,
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
    name: "Contratos",
    layout: "/admin",
    path: "contracts",
    icon: <MdDescription className="h-6 w-6" />,
    component: <Contracts />,
  },
  {
    name: "Financeiro",
    layout: "/admin",
    path: "payments",
    icon: <MdAttachMoney className="h-6 w-6" />,
    component: <Payments />,
  },
  {
    name: "Manutenções",
    layout: "/admin",
    path: "maintenances",
    icon: <MdBuild className="h-6 w-6" />,
    component: <Maintenances />,
  },
  {
    name: "Agenda",
    layout: "/admin",
    path: "appointments",
    icon: <MdEvent className="h-6 w-6" />,
    component: <Appointments />,
  },
  {
    name: "Relatórios",
    layout: "/admin",
    path: "reports",
    icon: <MdAssessment className="h-6 w-6" />,
    component: <Reports />,
  },
  {
    name: "Assistente IA",
    layout: "/admin",
    path: "assistant",
    icon: <MdSmartToy className="h-6 w-6" />,
    component: <Assistant />,
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
