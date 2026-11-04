# AI Agent => LLM + Tools + Memory + Reasoning

An AI Agent is a system that uses an AI model to
determine what actions to take in order to accomplish a goal.

An agent do :

- Understand a goal
- Reasoning/Make decisions
- Select Tools
- Observe results
- Change its next actions
- Stop wheb the task is complete

# llm vs ai agent

- LLM: Just a language model
- AI Agent: Has tools, memory, and reasoning

# Tool

- Tools are functions that an agent can use to perform actions
- Tools can be anything from a simple function to a complex API
- Tools can be used to perform actions like searching the web, getting weather information, etc.

type of tools:

1. Built-in tools
   - tavily (web search)
2. Custom tools

- custom functions
- report email
- generate report

Approches for builidng ai agent

1.  Agent with simple langchain createAgent()
2.  Agent with langgraph

# web search tool ,weather tool

For exmaple : what is weather in New York?
Answer LLM => ANALYZE => USE WEATHER TOOL => llm => Response
