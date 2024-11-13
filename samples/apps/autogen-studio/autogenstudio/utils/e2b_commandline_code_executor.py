import os
import re
import logging
from hashlib import md5
from pathlib import Path
import shlex
from typing import ClassVar, Dict, List, Optional, Union
from typing import List

from autogen.code_utils import _cmd, TIMEOUT_MSG

from autogen.coding.utils import silence_pip
from e2b_code_interpreter import Sandbox
from autogen.coding.base import CodeBlock, CodeExecutor, CodeExtractor, CommandLineCodeResult
from autogen.coding.markdown_code_extractor import MarkdownCodeExtractor
import random

logger = logging.getLogger(__name__)

__all__ = ("E2BCommandlineCodeExecutor",)

filename_patterns = [
    re.compile(r"^<!-- (filename:)?(.+?) -->", re.DOTALL),
    re.compile(r"^/\* (filename:)?(.+?) \*/", re.DOTALL),
    re.compile(r"^// (filename:)?(.+?)$", re.DOTALL),
    re.compile(r"^# (filename:)?(.+?)$", re.DOTALL),
]

# E2B accounts

# password: Just4admin2024$
# admin@bschools.ai: 

# Admin: e2b_28805f77f5055af5e392b47380a168f7f3eb401e
# Admin1: e2b_5b8813cda8fac5f2cfc51ac944c9747f102468c9
# Admin2: e2b_2b5a720fa1791b7764a11022e73149cbeecc85f7
# admin3: e2b_28914374f5b77fd444eb4201f52da09de4354cc1
# Admin4: e2b_a6bec1a2acbfca03689702510a336acdedc92057
# admin5: e2b_ead0384eeb25a1ebc4d0c3197826901efcf467b9
# admin6: e2b_b2a7d27bd2ce28c822b875bf1832c2c28cc5e26d
# Admin7: e2b_d643bd26f3b181a95e0f784cadc964b8cc4ffa63
# Admin8: e2b_aec35baed63c862fa1814981ed1e7b76ab2fb0a6
# Admin9: e2b_2b988358f795baf8849850a22ab33861c4844ea3
# Admin10: e2b_d3b508129dfde8384e399162e7ad0e4a42929881



# support@takin.ai: e2b_6e38c41a101e7fbfde36acf6a3dc2bfea02151ac


# Fake emails:

# Just4admin2024$

# test@build.ai: e2b_8d527e8cb4f9bb88f536ea4e971510ae477e230b
# admin@build.ai: e2b_acd8f50ccab0fe807a1406980f33e219be1b3041
# support@build.ai: e2b_65f72ef25e09f0ec718edfaf46ce7d0ea1d3d8b5
# dev@build.ai: e2b_93da56d89c07fbe3388667031a1e31f98033cc89
# product@build.ai: e2b_10ab63a2b9d3c72d30baeb6190884d55e6217384
def random_e2b_api_key():
    e2b_key_list = [
        'e2b_28805f77f5055af5e392b47380a168f7f3eb401e',
        'e2b_5b8813cda8fac5f2cfc51ac944c9747f102468c9',
        'e2b_2b5a720fa1791b7764a11022e73149cbeecc85f7',
        'e2b_28914374f5b77fd444eb4201f52da09de4354cc1',
        'e2b_a6bec1a2acbfca03689702510a336acdedc92057',
        'e2b_ead0384eeb25a1ebc4d0c3197826901efcf467b9',
        'e2b_b2a7d27bd2ce28c822b875bf1832c2c28cc5e26d',
        'e2b_d643bd26f3b181a95e0f784cadc964b8cc4ffa63',
        'e2b_aec35baed63c862fa1814981ed1e7b76ab2fb0a6',
        'e2b_2b988358f795baf8849850a22ab33861c4844ea3',
        'e2b_d3b508129dfde8384e399162e7ad0e4a42929881',
        'e2b_8d527e8cb4f9bb88f536ea4e971510ae477e230b',
        'e2b_acd8f50ccab0fe807a1406980f33e219be1b3041',
        'e2b_65f72ef25e09f0ec718edfaf46ce7d0ea1d3d8b5',
        'e2b_93da56d89c07fbe3388667031a1e31f98033cc89',
        'e2b_10ab63a2b9d3c72d30baeb6190884d55e6217384',
        'e2b_23373f3c85a6e71fa1e93f46c011da942a053da5' # faye
    ]
    return random.choice(e2b_key_list)

def _get_file_name_from_content(code: str, lang: str) -> str:
    """
    根据code获取文件名，如果没有文件名，就随机生成一个
    """
    first_line = code.split("\n")[0].strip()
    # TODO - support other languages
    for pattern in filename_patterns:
        matches = pattern.match(first_line)
        if matches is not None:
            return matches.group(2).strip()
    return f"tmp_code_{md5(code.encode()).hexdigest()}.{lang}"


class E2BCommandlineCodeExecutor(CodeExecutor):
    DEFAULT_EXECUTION_POLICY: ClassVar[Dict[str, bool]] = {
        "bash": True,
        "shell": True,
        "sh": True,
        "pwsh": True,
        "powershell": True,
        "ps1": True,
        "python": True,
        "javascript": False,
        "html": False,
        "css": False,
    }
    LANGUAGE_ALIASES: ClassVar[Dict[str, str]] = {"py": "python", "js": "javascript"}

    def __init__(self, sandbox_template: str = "base",
                 bind_dir: Optional[Union[Path, str]] = None, ):
        """初始化 e2b 沙盒执行器。

        Args:
            sandbox_template (str): 沙盒模板名，默认为 "base"。
            work_dir (str): 沙盒内的工作目录，主要执行代码，默认为 "/home/user"。
            bind_dir: 本地服务器的工作目录，主要将沙盒生成的文件保存下来，默认为  os.path.join( user_dir,  str(message.session_id),datetime.now().strftime("%Y%m%d_%H-%M-%S"),
        )
        """
        self._timeout = 60
        self.sandbox_template = sandbox_template
        # 此时沙盒默认的工作目录是/home/user，因为是random不同的api_key，所以暂时取消template参数，避免不同key之间的冲突
        self._sandbox = Sandbox(
            api_key=random_e2b_api_key(),
            # envs={"OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY")}
            )
        self._work_dir = Path('/home/user')
        self._bind_dir = bind_dir
        self._code_extractor = None  # 延迟加载的代码提取器
        self.execution_policies = self.DEFAULT_EXECUTION_POLICY.copy()

    def sandbox_download_file(self) -> List[Path]:
        files = []
        for fileInfo in self._sandbox.files.list(str(self._work_dir)):
            filename = fileInfo.name
            # 如果文件名以 . 开头或者是文件夹，则跳过
            if filename.startswith('.') or fileInfo.type.value=='dir':
                continue
            # 读取沙盒里文件内容，拼路径，读内容
            sandbox_path = self._work_dir / filename
            
            content = self._sandbox.files.read(str(sandbox_path))

            if isinstance(content, str):
                content = content.encode('utf-8')
            # 写本地
            autogen_code_path = self._bind_dir / filename
            
            with autogen_code_path.open("wb") as f:
                f.write(content)
            files.extend([autogen_code_path])
        return files

    @property
    def code_extractor(self) -> CodeExtractor:
        return MarkdownCodeExtractor()

    def execute_code_blocks(self, code_blocks: List[CodeBlock]) -> CommandLineCodeResult:
        """在 e2b 沙盒中执行代码块。

        Args:
            code_blocks (List[CodeBlock]): 要执行的代码块列表。

        Returns:
            CodeResult: 包含执行结果的对象。
        """
        if len(code_blocks) == 0:
            raise ValueError("No code blocks to execute.")
        outputs = []
        filenames = []
        last_exit_code = 0
        for code_block in code_blocks:
            lang = self.LANGUAGE_ALIASES.get(code_block.language.lower(), code_block.language.lower())
            if lang not in self.DEFAULT_EXECUTION_POLICY:
                outputs.append(f"Unsupported language {lang}\n")
                last_exit_code = 1
                break

            code = silence_pip(code_block.code, lang)
            filename = _get_file_name_from_content(code, lang)
            filenames.append(filename)
            code_path = self._work_dir / filename  # 获取完整的沙盒文件地址

            self._sandbox.files.write(str(code_path), code)

            command = ["timeout", str(self._timeout), _cmd(lang), str(code_path)]
            command_str = shlex.join(command)

            result = self._sandbox.commands.run(
                command_str,
                on_stdout=lambda data: print(data), on_stderr=lambda data: print(data))
            

            # result.wait()
            exit_code = result.exit_code
            if result.error:
                outputs.append(result.stderr)
            else:
                outputs.append(result.stdout)

            last_exit_code = exit_code

        files = self.sandbox_download_file()
        code_file = str(files[0]) if files else None
        return CommandLineCodeResult(exit_code=last_exit_code, output="".join(outputs), code_file=code_file)

    def stop(self) -> None:
        """(Experimental) Stop the code executor."""
        logger.info("Stop the E2B Commandline Code Executor...")
        self._sandbox.kill()

    def restart(self) -> None:
        """重启 e2b 沙盒执行器。"""
        logger.info("Restarting the E2B Commandline Code Executor...")
        self._sandbox.kill() # 关闭当前沙盒
        self._sandbox = Sandbox(
            api_key=random_e2b_api_key(),
            envs={"OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY")}
            )  # 使用相同模板重启沙盒
        logger.info("Sandbox restarted.")
