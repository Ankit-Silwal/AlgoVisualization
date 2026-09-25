"""One job, one container. Compilation is excluded from the execution timer."""
import json
import os
import subprocess
import sys
import time
import threading
import signal
import statistics

def emit(value):
    print(json.dumps(value), flush=True)

def main():
    job = json.load(sys.stdin)
    language = job['language']
    code = job['code']
    commands = {
        'JavaScript': ('main.js', None, ['node', '--max-old-space-size=96', 'main.js']),
        'Python': ('main.py', None, ['python3', '-I', 'main.py']),
        'C': ('main.c', ['gcc', '-O2', '-std=c17', '-o', 'main', 'main.c'], ['./main']),
        'Java': ('Main.java', ['javac', '-J-Xmx96m', 'Main.java'], ['java', '-Xmx96m', '-XX:ActiveProcessorCount=1', '-XX:+UseSerialGC', '-XX:-UsePerfData', 'Main']),
    }
    filename, compile_cmd, run_cmd = commands[language]
    with open(filename, 'w') as f:
        f.write(code)
    # Limit compiler/program output on disk; avoid unbounded communicate buffers.
    def invoke(cmd, stdin, timeout):
        with open('/work/out', 'w+') as out, open('/work/err', 'w+') as err:
            start = time.perf_counter()
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, text=True, stdout=out, stderr=err, start_new_session=True)
            expired = threading.Event()
            def terminate():
                expired.set()
                try: os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError: pass
            timer = threading.Timer(timeout, terminate)
            timer.daemon = True
            timer.start()
            try: process.communicate(stdin)
            finally: timer.cancel()
            status = 'tle' if expired.is_set() else ('ok' if process.returncode == 0 else 'error')
            elapsed = (time.perf_counter() - start) * 1000
            out.seek(0); err.seek(0)
            return status, elapsed, out.read(16000), err.read(16000)
    if compile_cmd:
        status, _, out, err = invoke(compile_cmd, '', 12)
        if status != 'ok':
            emit({'status': 'compile_error', 'durationMs': 0, 'stdout': out, 'stderr': err or 'Compilation timed out.'})
            return
    samples = []
    for _ in range(max(1, min(7, job.get('repetitions', 1)))):
        status, elapsed, out, err = invoke(run_cmd, job.get('stdin', ''), job.get('timeout', 2))
        if status != 'ok':
            emit({'status': status, 'durationMs': elapsed, 'stdout': out, 'stderr': err, 'samplesMs': samples})
            return
        samples.append(elapsed)
    emit({'status': 'ok', 'durationMs': statistics.median(samples), 'stdout': out, 'stderr': err, 'samplesMs': samples, 'minMs': min(samples), 'maxMs': max(samples)})

try:
    main()
except Exception as e:
    emit({'status': 'error', 'durationMs': 0, 'stdout': '', 'stderr': str(e)[:2000]})
