import Logo from "./logo";
import Icon from "./icons";
import { navigate } from "gatsby";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  Bars3Icon,
  BellIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { appContext } from "../hooks/provider";
import { Link } from "gatsby";
import React from "react";
import {
  getTakinServerUrl
} from "../components/utils";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Header = ({ meta, link }: any) => {
  const TakinServerUrl = getTakinServerUrl();
  const { user, logout } = React.useContext(appContext);
  const userName = user ? user.name : "Unknown";
  const userAvatarUrl = user ? user.image : ""; // takin command:修改用户展示
  const user_id = user ? user.name : "unknown";

  const links: any[] = [
    { name: "Build", href: "/build" },
    { name: "Playground", href: "/" },
    // { name: "Gallery", href: "/gallery" },
    // { name: "Data Explorer", href: "/explorer" },
  ];

  const DarkModeToggle = () => {
    return (
      <appContext.Consumer>
        {(context: any) => {
          return (
            <button
              onClick={() => {
                if (context.darkMode === "dark") {
                  context.setDarkMode("light");
                } else {
                  context.setDarkMode("dark");
                }
              }}
              type="button"
              className="flex-shrink-0 bg-primary p-1 text-secondary rounded-full hover:text-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              <span className="sr-only">Toggle dark mode </span>
              {context.darkMode === "dark" && (
                <MoonIcon className="h-6 w-6" aria-hidden="true" />
              )}
              {context.darkMode === "light" && (
                <SunIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          );
        }}
      </appContext.Consumer>
    );
  };
  return (
    <Disclosure
      as="nav"
      className="bg-primary text-primary mb-8 border-b border-secondary"
    >
      {({ open }) => (
        <>
          <div className="  px-0 sm:px-0 lg:px-0 ">
            <div className="flex justify-between h-16">
              <div className="flex lg:px-0">
                <div className="flex flex-shrink-0 justify-center items-center">
                  <div
                    className="inline-block text-slate-900 bg-primary mr-1 pt-2 cursor-pointer"
                    onClick={() => navigate(TakinServerUrl)}
                  >
                    <Logo className="w-[100px]" />
                  </div>
                </div>

                <div className="hidden md:ml-6 md:flex md:space-x-6">
                  {/* Current: "border-accent text-gray-900", Default: "border-transparent text-secondary hover:border-gray-300 hover:text-primary" */}
                  {links.map((data, index) => {
                    const isActive = data.href === link;
                    const activeClass = isActive
                      ? "bg-accent  "
                      : "bg-secondary ";
                    return (
                      <div
                        key={index + "linkrow"}
                        className={`text-primary  items-center hover:text-accent  px-1 pt-1 block   text-sm font-medium `}
                      >
                        <Link
                          className="hover:text-accent h-full flex flex-col"
                          to={data.href}
                        >
                          <div className=" flex-1 flex-col flex">
                            <div className="flex-1"></div>
                            <div className="pb-2 px-3">{data.name}</div>
                          </div>
                          <div
                            className={`${activeClass}  w-full h-1 rounded-t-lg `}
                          ></div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-secondary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              {
                <div className="hidden lg:ml-4 md:flex md:items-center">
                  {/*<DarkModeToggle />*/}

                  {user && (
                    <>
                      <div className="ml-3 flex items-center space-x-2">
                        <Icon icon="wallet" size={6} />
                        <span
                          className="text-sm text-primary"
                          title={`Subscription credits: ${(
                            Number(user?.subscriptionCredits) || 0
                          ).toFixed(0)} + Purchased credits: ${(
                            Number(user?.subscriptionPurchasedCredits) || 0
                          ).toFixed(0)} + Extra credits: ${(
                            Number(user?.extraCredits) || 0
                          ).toFixed(0)}`}
                        >
                          {(
                            (Number(user?.subscriptionCredits) || 0) +
                            (Number(user?.subscriptionPurchasedCredits) || 0) +
                            (Number(user?.extraCredits) || 0)
                          ).toFixed(0)}
                        </span>
                      </div>

                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-4 relative flex-shrink-0">
                        <div>
                          <Menu.Button className="bg-primary rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                            <span className="sr-only">Open user menu</span>
                            {userAvatarUrl && (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={userAvatarUrl}
                                alt=""
                              />
                            )}
                            {!userAvatarUrl && userName && (
                              <div className="border-2 bg-accent pt-1 h-8 w-8 align-middle text-sm text-white rounded-full">
                                {userName[0]}
                              </div>
                            )}
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="z-50 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-primary ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <a
                                  href={`${TakinServerUrl}/user`}
                                  className={classNames(
                                    active ? "bg-secondary" : "",
                                    "block px-4 py-2 text-sm text-primary"
                                  )}
                                >
                                  Settings
                                </a>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <span
                                  onClick={() => {
                                    logout();
                                  }}
                                  className={classNames(
                                    active ? "bg-secondary" : "",
                                    "block px-4 py-2 text-sm text-primary cursor-pointer"
                                  )}
                                >
                                  Sign out
                                </span>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </>
                  )}
                </div>
              }
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {/* Current: "bg-indigo-50 border-accent text-accent", Default: "border-transparent text-gray-600 hover:bg-primary hover:border-gray-300 hover:text-primary" */}
              {links.map((data, index) => {
                return (
                  <Disclosure.Button
                    key={index + "linkrow"}
                    as="a"
                    href={data.href}
                    className="bg-secondary border-accent text-accent block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  >
                    {data.name}
                  </Disclosure.Button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 pb-2">
              {" "}
              Dark mode <DarkModeToggle />{" "}
            </div>
            {user && (
              <div className="pt-4 pb-3 border-t border-secondary z-50">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    {userAvatarUrl && (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={userAvatarUrl}
                        alt=""
                      />
                    )}
                    {!userAvatarUrl && userName && (
                      <div className="border-2 bg-accent text-sm text-white h-8 w-8 pt-1   rounded-full text-center">
                        {userName[0]}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-primary">{userName}</div>
                    <div className="text-xs   text-secondary">{user_id}</div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 bg-primary p-1 text-secondary rounded-full hover:text-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    onClick={() => logout()}
                    className="block px-4 py-2 text-base font-medium text-secondary hover:text-primary cursor-pointer"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header;
