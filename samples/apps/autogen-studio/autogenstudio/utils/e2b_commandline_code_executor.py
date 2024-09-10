import re
import logging
from hashlib import md5
from pathlib import Path
import shlex
from time import sleep
from typing import Any, ClassVar, Dict, List, Optional, Type, Union
from typing import List

from autogen.code_utils import _cmd, TIMEOUT_MSG

from autogen.coding.utils import silence_pip
from e2b import Sandbox
from autogen.coding.base import CodeBlock, CodeExecutor, CodeExtractor, CommandLineCodeResult
from autogen.coding.markdown_code_extractor import MarkdownCodeExtractor

logger = logging.getLogger(__name__)

__all__ = ("E2BCommandlineCodeExecutor",)

filename_patterns = [
    re.compile(r"^<!-- (filename:)?(.+?) -->", re.DOTALL),
    re.compile(r"^/\* (filename:)?(.+?) \*/", re.DOTALL),
    re.compile(r"^// (filename:)?(.+?)$", re.DOTALL),
    re.compile(r"^# (filename:)?(.+?)$", re.DOTALL),
]

def _get_file_name_from_content(code: str,lang:str) -> str :
    """
    根据code获取文件名，如果没有文件名，就随机生成一个
    """
    first_line = code.split("\n")[0].strip()
    # TODO - support other languages
    for pattern in filename_patterns:
        matches = pattern.match(first_line)
        if matches is not None:
            return matches.group(2).strip()
    return  f"tmp_code_{md5(code.encode()).hexdigest()}.{lang}"
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
        # 此时沙盒默认的工作目录是/home/user
        self._sandbox = Sandbox(template=sandbox_template,
                                on_stdout=lambda output: logger.info(">>>> e2b sandbox:", output.line) )
        self._work_dir = Path('/home/user')
        self._bind_dir = bind_dir
        self._code_extractor = None  # 延迟加载的代码提取器
        self.execution_policies = self.DEFAULT_EXECUTION_POLICY.copy()

    def sandbox_download_file(self) -> List[Path]:
        files = []
        for fileInfo in self._sandbox.filesystem.list(str(self._work_dir)):
            filename = fileInfo.name
            # 如果文件名以 . 开头，则跳过
            if filename.startswith('.') or fileInfo.is_dir:
                continue
            sandbox_path = str(self._work_dir/filename)
            file_in_bytes = self._sandbox.download_file(sandbox_path)

            autogen_code_path =self._bind_dir / filename
            with autogen_code_path.open("wb") as f:
                f.write(file_in_bytes)
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

            self._sandbox.filesystem.write(str(code_path), code)

            command = ["timeout", str(self._timeout), _cmd(lang), str(code_path)]
            command_str = shlex.join(command)

            result = self._sandbox.process.start_and_wait(
                command_str,
                on_stdout=lambda output: print("process", output.line),
            )

            # result.wait()
            exit_code = result.exit_code
            if result.error:
                outputs.append(result.stderr)
            else:
                outputs.append(result.stdout)

            last_exit_code = exit_code
            # self._sandbox.close()
        files = self.sandbox_download_file()
        code_file = str(files[0]) if files else None
        return CommandLineCodeResult(exit_code=last_exit_code, output="".join(outputs), code_file=code_file)


    def stop(self) -> None:
        """(Experimental) Stop the code executor."""
        logger.info("Stop the E2B Commandline Code Executor...")
        self._sandbox.close()

    def restart(self) -> None:
        """重启 e2b 沙盒执行器。"""
        logger.info("Restarting the E2B Commandline Code Executor...")
        self._sandbox.close()  # 关闭当前沙盒
        self._sandbox = Sandbox(template=self.sandbox_template)  # 使用相同模板重启沙盒
        logger.info("Sandbox restarted.")
