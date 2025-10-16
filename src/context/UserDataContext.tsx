// "use client";

// import { createClient } from "@/lib/supabase/client";
// import { createContext, useContext, useEffect, useState } from "react";

// const MyContext = createContext(null);

// export function UserDataProvider({ children }) {
//   const [state, setState] = useState({ user: null });
//   const [stringData, setStringData] = useState("test string");
//   const [filesCurrentFolder, setFilesCurrentFolder] = useState(null);
//   const [files, setFiles] = useState([]);
//   const [folders, setFolders] = useState([]);
//   const [repeatFetch, setRepeatFetch] = useState(false);

//   useEffect(() => {
//     const fetchAllData = async () => {
//       const supabase = await createClient();

//       const { data: userData } = await supabase.auth.getUser();
//
//       if (userData.user) {
//         const { data: filesData, error } = await supabase
//           .from("files")
//           .select("*")
//           .eq("user_id", userData.user.id);
//         //         setFiles(filesData);

//         const { data: foldersData, error: folderError } = await supabase
//           .from("file_folders")
//           .select("*")
//           .eq("user_id", userData.user.id);
//         //         setFolders(foldersData);
//       }
//     };
//     fetchAllData();
//   }, [repeatFetch]);

//   return (
//     <MyContext.Provider
//       value={{
//         state,
//         setState,
//         filesCurrentFolder,
//         setFilesCurrentFolder,
//         files,
//         setFiles,
//         folders,
//         setFolders,
//         repeatFetch,
//         setRepeatFetch,
//       }}
//     >
//       {children}
//     </MyContext.Provider>
//   );
// }

// export function UserDataContext() {
//   return useContext(MyContext);
// }

"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";

type UserDataContextType = {
  state: any;
  setState: React.Dispatch<any>;
  passwords: any;
  setPasswords: React.Dispatch<any>;
  folders: any;
  setFolders: React.Dispatch<any>;
  repeatFetch: boolean;
  setRepeatFetch: React.Dispatch<React.SetStateAction<boolean>>;
};

const MyContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: any) {
  const [state, setState] = useState<any>({ user: null });
  const [passwords, setPasswords] = useState<any>([]);
  const [folders, setFolders] = useState<any>([]);
  const [repeatFetch, setRepeatFetch] = useState<any>(false);

  useEffect(() => {
    const fetchAllData = async () => {
      const supabase = await createClient();

      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        const { data: passwordsData, error } = await supabase
          .from("passwords")
          .select("*")
          .eq("user_id", userData.user.id)
          .is("organization", null);

        setPasswords(passwordsData);

        const { data: foldersData, error: folderError } = await supabase
          .from("password_folders")
          .select("*")
          .eq("user_id", userData.user.id);
        setFolders(foldersData);
      }
    };
    fetchAllData();
  }, [repeatFetch]);

  return (
    <MyContext.Provider
      value={{
        state,
        setState,
        passwords,
        setPasswords,
        folders,
        setFolders,
        repeatFetch,
        setRepeatFetch,
      }}
    >
      {children}
    </MyContext.Provider>
  );
}

export function UserDataContext() {
  return useContext(MyContext);
}
