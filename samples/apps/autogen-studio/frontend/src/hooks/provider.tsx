import React, {useState, useMemo} from "react";
import {navigate} from "@reach/router"
import {
    fetchJSON,
    getCookie,
    getLocalStorage, eraseCookie,
    setLocalStorage,
} from "../components/utils";
import {message} from "antd";
import {BounceLoader} from "../components/atoms";

export interface IUser {
    name: string;
    email?: string;
    avatar?: string;
    role: number;
    level?: number
    extra_credits?: number
    subscription_credits?: number
}

export interface AppContextType {
    user: IUser | null;
    setUser: any;
    logout: any;
    cookie_name: string;
    darkMode: string;
    setDarkMode: any;
}


const signUrl = 'https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps';
const cookie_name = "__Secure-next-auth.session-token";

export const appContext = React.createContext<AppContextType>(
    {} as AppContextType
);
const Provider = ({children}: any) => {
    const storedValue = getLocalStorage("darkmode", false);
    const [darkMode, setDarkMode] = useState(
        storedValue === null ? "light" : storedValue === "dark" ? "dark" : "light"
    );
    const [user, setUser] = useState<IUser | null>(null);
    const token =  getCookie(cookie_name)

    const fetchUser = () => {
        const payLoad = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const onSuccess = (data: any) => {
            data ? setUser(data) : navigate(signUrl)
        };
        const onError = (err: any) => {
            navigate(signUrl)
        };
        fetchJSON(`api/login?token=${token}`, payLoad, onSuccess, onError);
    };


    const logout = () => {
        setUser(null);
        eraseCookie(cookie_name);
        navigate(signUrl)
    };

    const updateDarkMode = (darkMode: string) => {
        setDarkMode(darkMode);
        setLocalStorage("darkmode", darkMode, false);
    };

    useMemo(() => {
        // 检查浏览器中是否有cookie，如果没有则跳转登录页面；如果有就进行解析
        fetchUser()
    }, [token])

    return (
        <appContext.Provider
            value={{
                user,
                setUser,
                logout,
                cookie_name,
                darkMode,
                setDarkMode: updateDarkMode,
            }}
        >
            {user ? children :
                <div className="w-full text-center py-20 flex flex-col space-y-4">
                    <BounceLoader className="bg-gray-900"/>
                    <p className="inline-block">loading ..</p>

                </div>
            }
        </appContext.Provider>
    );
};

export default ({element}: any) => <Provider>{element}</Provider>;
