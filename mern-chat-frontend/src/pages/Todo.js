import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Input, Button } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Grid } from "antd";
import "./Todo.css";

const Todo = ({ socket }) => {
	const { Title } = Typography;
	const screen = Grid.useBreakpoint();
	const [task, setTask] = useState("");
	const [taskList, setTaskList] = useState([]);

	const addTask = () => {
		if (task.trim()) {
			socket.emit("addTask", { task });
			setTask("");
		}
	};

	const deleteTask = (taskId) => {
		socket.emit("deleteTask", taskId);
	};

	useEffect(() => {
		socket.on("allTasks", (tasks) => {
			setTaskList(tasks);
		});

		// Clean up when component unmounts
		return () => socket.off("allTasks");
	}, [socket]);

	return (
		<div className="main">
			<div className="App">
				<Col xs={24} md={24}>
					<Row className="Rows">
						<Title level={2} style={{ color: "#9B59B6", margin: "1rem" }}>
							Task Manager
						</Title>
					</Row>
					<Row xs={12} md={12} className="Rows" gutter={12}>
						<Col xs={16} md={16} className="Cols">
							<Input
								className="search"
								placeholder="Task"
								value={task}
								onChange={(event) => setTask(event.target.value)}
							/>
						</Col>
						<Col xs={6} md={6} className="Cols">
							<Button
								onClick={addTask}
								style={{
									color: "white",
									backgroundColor: "#9B59B6",
									height: "2rem",
									borderRadius: "5px",
									width: "100%",
									border: "none",
								}}
							>
								Add Task
							</Button>
						</Col>
					</Row>
					<Row className="todo">
						<Col className="task-list-container">
							{" "}
							{/* Apply scrollable container */}
							{taskList.map((item) => (
								<Row span={24} key={item._id} gutter={12} justify={"space-between"}>
									<Col>{item.task}</Col>
									<Col>
										<Button
											className="complete"
											onClick={() => deleteTask(item._id)}
											style={{ width: "100%" }}
										>
											<CheckCircleOutlined />
										</Button>
									</Col>
								</Row>
							))}
						</Col>
					</Row>
				</Col>
			</div>
		</div>
	);
};

export default Todo;
