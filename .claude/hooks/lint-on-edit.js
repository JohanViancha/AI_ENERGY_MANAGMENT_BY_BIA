let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (/\.(ts|tsx)$/.test(filePath)) {
      require('child_process').execSync(`npx eslint "${filePath}"`, { stdio: 'inherit' });
    }
  } catch {
    // non-ts/tsx file, missing input, or eslint found issues (already printed via inherit)
  }
});
