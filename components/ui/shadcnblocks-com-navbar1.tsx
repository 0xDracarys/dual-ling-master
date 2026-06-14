"use client"

import * as React from "react";
import Link from "next/link";
import { Book, Menu, GraduationCap, Users, Settings, LogOut, User, BarChart } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  auth?: {
    login: {
      text: string;
      url: string;
    };
    signup: {
      text: string;
      url: string;
    };
  };
  userMenu?: {
    show: boolean;
    username?: string;
    email?: string;
    role?: string;
    onLogout?: () => void;
  };
}

const Navbar1 = ({
  logo = {
    url: "/",
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20'%3E🇱🇹🇺🇸%3C/text%3E%3C/svg%3E",
    alt: "logo",
    title: "English With Evelina",
  },
  menu = [
    { title: "Home", url: "/" },
    { title: "Courses", url: "/courses" },
    { title: "Pricing", url: "/pricing" },
    { title: "About", url: "/about" },
    { title: "Contact", url: "/contact" },
  ],
  mobileExtraLinks = [],
  auth = {
    login: { text: "Log in", url: "/auth/login" },
    signup: { text: "Sign up", url: "/auth/register" },
  },
  userMenu = {
    show: false,
  },
}: Navbar1Props) => {
  return (
    <section className="py-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <a href={logo.url} className="flex items-center gap-2 group">
              <img src={logo.src} className="w-10 h-10 object-cover rounded-full border border-gray-100 shadow-sm group-hover:scale-110 transition-transform duration-300" alt={logo.alt} />
              <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{logo.title}</span>
            </a>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <LanguageToggle />
            {userMenu.show ? (
              <>
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem className="text-muted-foreground">
                      <NavigationMenuTrigger>
                        <User className="size-4 mr-2" />
                        {userMenu.username}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="w-64 p-3">
                          <li className="mb-3 p-2 border-b">
                            <div className="text-sm font-semibold">{userMenu.username}</div>
                            <div className="text-xs text-muted-foreground truncate">{userMenu.email}</div>
                            <div className="text-xs text-muted-foreground capitalize mt-1 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                              {userMenu.role}
                            </div>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link
                                className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                                href="/profile"
                              >
                                <User className="size-5 shrink-0" />
                                <div>
                                  <div className="text-sm font-semibold">Profile</div>
                                  <p className="text-sm leading-snug text-muted-foreground">
                                    View and edit your profile
                                  </p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link
                                className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                                href="/settings"
                              >
                                <Settings className="size-5 shrink-0" />
                                <div>
                                  <div className="text-sm font-semibold">Settings</div>
                                  <p className="text-sm leading-snug text-muted-foreground">
                                    Manage your account settings
                                  </p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <button
                              onClick={userMenu.onLogout}
                              className="w-full flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground text-left"
                            >
                              <LogOut className="size-5 shrink-0" />
                              <div>
                                <div className="text-sm font-semibold">Log out</div>
                                <p className="text-sm leading-snug text-muted-foreground">
                                  Sign out of your account
                                </p>
                              </div>
                            </button>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <a href={auth.login.url}>{auth.login.text}</a>
                </Button>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <a href={auth.signup.url}>{auth.signup.text}</a>
                </Button>
              </>
            )}
          </div>
        </nav>
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <a href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-10 h-10 object-cover rounded-full border border-gray-100 shadow-sm" alt={logo.alt} />
              <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{logo.title}</span>
            </a>
            <div className="flex items-center gap-2">
              <LanguageToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href={logo.url} className="flex items-center gap-2">
                      <img src={logo.src} className="w-10 h-10 object-cover rounded-full border border-gray-100 shadow-sm" alt={logo.alt} />
                      <span className="text-lg font-semibold">
                        {logo.title}
                      </span>
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  {mobileExtraLinks.length > 0 && (
                    <div className="border-t py-4">
                      <div className="grid grid-cols-2 justify-start">
                        {mobileExtraLinks.map((link, idx) => (
                          <a
                            key={idx}
                            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                            href={link.url}
                          >
                            {link.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {userMenu.show ? (
                      <>
                        <div className="p-4 bg-gray-50 rounded-md mb-2">
                          <div className="font-medium text-gray-900">{userMenu.username}</div>
                          <div className="text-sm text-gray-600 truncate">{userMenu.email}</div>
                          <div className="text-xs text-gray-600 capitalize mt-1 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                            {userMenu.role}
                          </div>
                        </div>
                        <Button asChild variant="outline">
                          <Link href="/profile">
                            <User className="size-4 mr-2" />
                            Profile
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/settings">
                            <Settings className="size-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                        <Button onClick={userMenu.onLogout} variant="destructive">
                          <LogOut className="size-4 mr-2" />
                          Log out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline">
                          <a href={auth.login.url}>{auth.login.text}</a>
                        </Button>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                          <a href={auth.signup.url}>{auth.signup.text}</a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title} className="text-muted-foreground">
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <a
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                    href={subItem.url}
                  >
                    {subItem.icon}
                    <div>
                      <div className="text-sm font-semibold">
                        {subItem.title}
                      </div>
                      {subItem.description && (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </a>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <a
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      {item.title}
    </a>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <a
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              href={subItem.url}
            >
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </a>
  );
};

export { Navbar1 };
