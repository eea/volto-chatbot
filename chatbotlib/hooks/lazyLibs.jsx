import React, { useEffect, useState } from "react";
const libraryMapping = {
  // rehypePrism: () => import("rehype-prism-plus"),
  // remarkGfm: () => import("remark-gfm"),
};

const injectLazyLibs = (libraryNames) => (WrappedComponent) => {
  return (props) => {
    const [libraries, setLibraries] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadLibraries = async () => {
        const libs = {};
        for (const name of libraryNames) {
          if (libraryMapping[name]) {
            libs[name] = await libraryMapping[name]();
          }
        }
        console.log("loading", libs);
        setLibraries(libs);
        setLoading(false);
      };

      loadLibraries();
    }, libraryNames); // libraryNames

    if (loading) {
      return <div>Loading libraries...</div>;
    }

    return <WrappedComponent {...props} {...libraries} />;
  };
};

export default injectLazyLibs;
