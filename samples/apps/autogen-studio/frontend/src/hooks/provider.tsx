import React, {useState, useMemo} from "react";
import {navigate} from "@reach/router"
import {
    fetchJSON,
    getLocalStorage,
    setLocalStorage, getServerUrl,
} from "../components/utils";
import {BounceLoader} from "../components/atoms";

export interface IUser {
    id: string;
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
    darkMode: string;
    setDarkMode: any;
}

// TODO:修改callback
const signUrl = 'https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fautogen.takin.ai';

export const appContext = React.createContext<AppContextType>(
    {} as AppContextType
);
const Provider = ({children}: any) => {
    const serverUrl = getServerUrl();
    const storedValue = getLocalStorage("darkmode", false);
    const [darkMode, setDarkMode] = useState(
        storedValue === null ? "light" : storedValue === "dark" ? "dark" : "light"
    );
    const [user, setUser] = useState<IUser | null>( {
    id: '64dded6dde1ff3bc8b6d4488',
    name: "ffaye1225@gmail.com",
    email: 'ffaye1225@gmail.com',

    role: 50,
    subscription_credits:2000,})
    const [init, setInit] = useState(false);
    const fetchUser = () => {
        const payLoad = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        };

        const onSuccess = (data: any) => {
            if (data && !data['status']) {
                setUser(null);
                setLocalStorage("user_info", null);
                navigate(signUrl);
                return;
            }
            const userInfo = getLocalStorage("user_info");
            if (userInfo !== null) {
                setUser(userInfo);
                setInit(true);
                return;
            }
            setUser(data.data)
            setLocalStorage("user_info", data.data);
            setInit(true);
        };
        const onError = (err: any) => {
            navigate(signUrl)
        };
        fetchJSON(`${serverUrl}/login`, payLoad, onSuccess, onError);
    };


    const logout = () => {
        const payLoad = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        };

        const onSuccess = (data: any) => {
            if (data && !data['status']) return
            setUser(null);
            setLocalStorage("user_info", null);
            navigate(signUrl)
        };
        const onError = (err: any) => {
            navigate(signUrl)
        };
        fetchJSON(`${serverUrl}/logout`, payLoad, onSuccess, onError);

    };

    const updateDarkMode = (darkMode: string) => {
        setDarkMode(darkMode);
        setLocalStorage("darkmode", darkMode, false);
    };

    useMemo(() => {
        // 检查浏览器中是否有cookie，如果没有则跳转登录页面；如果有就进行解析
        fetchUser()
    }, [])

    return (
        <appContext.Provider
            value={{
                user,
                setUser,
                logout,
                darkMode,
                setDarkMode: updateDarkMode,
            }}
        >
            {children
            }
        </appContext.Provider>
    );
};

export default ({element}: any) => <Provider>{element}</Provider>;
