import * as React from "react";
import SkillsView from "./skills";
import AgentsView from "./agents";
import WorkflowView from "./workflow";
import { Tabs } from "antd";
import {
  BugAntIcon,
  CpuChipIcon,
  Square2StackIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import ModelsView from "./models";
import { appContext } from "../../../hooks/provider";

const BuildView = () => {
  const { user } = React.useContext(appContext);
  const isAdmin = (user?.role || 10) >= 50;

  const tabs = [
    {
      label: (
        <div className="w-full">
          <BugAntIcon className="h-4 w-4 inline-block mr-1" />
          Skills
        </div>
      ),
      key: "1",
      children: <SkillsView />,
    },
    {
      label: (
        <div className="w-full">
          <CpuChipIcon className="h-4 w-4 inline-block mr-1" />
          Models
        </div>
      ),
      key: "2",
      children: <ModelsView />,
    },
    {
      label: (
        <>
          <Square2StackIcon className="h-4 w-4 inline-block mr-1" />
          Agents
        </>
      ),
      key: "3",
      children: <AgentsView />,
    },
    {
      label: (
        <>
          <Square3Stack3DIcon className="h-4 w-4 inline-block mr-1" />
          Workflows
        </>
      ),
      key: "4",
      children: <WorkflowView />,
    },
  ];

  // Conditionally filter out the Models tab if not an admin
  const filteredTabs = isAdmin ? tabs : tabs.filter((tab) => tab.key !== "2");

  return (
    <div className=" ">
      {/* <div className="mb-4 text-2xl">Build </div> */}
      <div className="mb-6 text-sm hidden text-secondary">
        {" "}
        Create skills, agents and workflows for building multiagent capabilities{" "}
      </div>

      <div className="mb-4 text-primary">
        <Tabs
          tabBarStyle={{ paddingLeft: 0, marginLeft: 0 }}
          defaultActiveKey={"4"}
          tabPosition="left"
          items={filteredTabs}
        />
      </div>

      <div></div>
    </div>
  );
};

export default BuildView;
