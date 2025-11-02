import React, { createContext, useContext, useState, useEffect } from "react";
import { nanoid } from "nanoid";
var SessionContext = createContext(undefined);
export function SessionProvider(_a) {
    var children = _a.children;
    var _b = useState(""), sessionId = _b[0], setSessionId = _b[1];
    useEffect(function () {
        // Get existing sessionId from localStorage or create a new one
        var existingSessionId = localStorage.getItem("true-false-history-session");
        if (existingSessionId) {
            setSessionId(existingSessionId);
        }
        else {
            var newSessionId = nanoid();
            localStorage.setItem("true-false-history-session", newSessionId);
            setSessionId(newSessionId);
        }
    }, []);
    // Don't render children until we have a sessionId
    if (!sessionId) {
        return null;
    }
    return (<SessionContext.Provider value={{ sessionId: sessionId }}>
      {children}
    </SessionContext.Provider>);
}
export function useSession() {
    var context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}
