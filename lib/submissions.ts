export type Submission = {
  language: string;
  code: string;
  stdin: string;
  entrypoint?: string;
  mode?: "auto" | "program" | "function";
};
export function detectEntrypoint(code: string, language: string): string | undefined {
  if (language === "JavaScript")
    return code.match(/(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)\s*(?:\(|=)/)?.[1];
  if (language === "Python") return code.match(/def\s+(?!__)(\w+)\s*\(/)?.[1];
  if (language === "Java")
    return code.match(/public\s+(?:static\s+)?[\w<>\[\], ?]+\s+(?!main\b)(\w+)\s*\(/)?.[1];
  return code.match(
    /(?:^|\n)\s*(?:int|long|double|float|bool|char|void)(?:\s*\*)?\s+(?!main\b)(\w+)\s*\(/,
  )?.[1];
}
export function isFunctionSubmission(s: Submission): boolean {
  if (s.mode === "program") return false;
  if (s.mode === "function" || s.entrypoint) return true;
  if (s.language === "Java")
    return !/static\s+void\s+main\s*\(/.test(s.code) && /class\s+Solution\b/.test(s.code);
  if (s.language === "Python") return /class\s+Solution\b/.test(s.code);
  if (s.language === "C") return !/\bmain\s*\(/.test(s.code);
  return (
    !/\b(console\.|require\(|process\.)/.test(s.code) && !!detectEntrypoint(s.code, s.language)
  );
}
export function parseArguments(stdin: string): unknown[] {
  if (stdin.trim().startsWith("[")) {
    const args = JSON.parse(stdin);
    if (!Array.isArray(args)) throw new Error("Method input must be a JSON array of arguments.");
    return args;
  }
  const tokens = stdin.trim().split(/\s+/).map(Number);
  const n = tokens[0];
  if (
    !Number.isInteger(n) ||
    n < 0 ||
    n > 20000 ||
    tokens.length < n + 1 ||
    tokens.some((v) => !Number.isFinite(v))
  )
    throw new Error(
      "Use a JSON argument array, or n followed by n integers and an optional target.",
    );
  return [tokens.slice(1, n + 1), tokens[n + 1] ?? 0];
}
export function wrapSubmission(s: Submission): string {
  if (!isFunctionSubmission(s)) return s.code;
  const method = s.entrypoint || detectEntrypoint(s.code, s.language);
  if (!method || !/^[$A-Za-z_][\w$]*$/.test(method))
    throw new Error("Choose a valid method entry point in Submission settings.");
  const args = parseArguments(s.stdin),
    jsonInput = s.stdin.trim().startsWith("[");
  const payload = JSON.stringify(args);
  if (s.language === "JavaScript")
    return `${s.code}\nconst __args=JSON.parse(${JSON.stringify(payload)});\nconst __fn=typeof ${method}==='function'?${method}:(typeof Solution!=='undefined'?new Solution()[${JSON.stringify(method)}]:null);\nif(!__fn)throw new Error('Method not found');\nPromise.resolve(__fn(...__args)).then(v=>{v=v===undefined?__args[0]:v;console.log(${jsonInput ? "JSON.stringify(v)" : "Array.isArray(v)?v.join(' '):String(v)"});});`;
  if (s.language === "Python")
    return `from typing import *\nimport json\nclass ListNode:\n    def __init__(self,val=0,next=None): self.val,self.next=val,next\nclass TreeNode:\n    def __init__(self,val=0,left=None,right=None): self.val,self.left,self.right=val,left,right\n${s.code}\n__args=json.loads(${JSON.stringify(payload)})\n__fn=getattr(Solution(),${JSON.stringify(method)}) if 'Solution' in globals() else globals()[${JSON.stringify(method)}]\nimport inspect\nfor __i,(__key,__param) in enumerate(inspect.signature(__fn).parameters.items()):\n    if __i>=len(__args): break\n    __ann=str(__param.annotation)\n    if 'ListNode' in __ann or __key in ('head','head1','head2','l1','l2'):\n        __node=None\n        for __v in reversed(__args[__i] or []): __node=ListNode(__v,__node)\n        __args[__i]=__node\n    elif 'TreeNode' in __ann or __key=='root':\n        __values=__args[__i] or []\n        __root=TreeNode(__values[0]) if __values and __values[0] is not None else None\n        __q=[__root] if __root else []; __j=1\n        for __node in __q:\n            for __side in ('left','right'):\n                if __j<len(__values) and __values[__j] is not None:\n                    __child=TreeNode(__values[__j]);setattr(__node,__side,__child);__q.append(__child)\n                __j+=1\n        __args[__i]=__root\n__count=len(inspect.signature(__fn).parameters)\n__result=__fn(*__args[:__count])\nif __result is None and __args: __result=__args[0]\ndef __encode(v):\n    if isinstance(v,ListNode):\n        out=[]\n        while v and len(out)<20000: out.append(v.val);v=v.next\n        return out\n    if isinstance(v,TreeNode):\n        out=[];q=[v]\n        for node in q:\n            if len(out)>20000: break\n            out.append(node.val if node else None)\n            if node:q.extend([node.left,node.right])\n        while out and out[-1] is None:out.pop()\n        return out\n    return v\n__result=__encode(__result)\nprint(json.dumps(__result,separators=(',',':')) if ${jsonInput ? "True" : "False"} else (' '.join(map(str,__result)) if isinstance(__result,list) else __result))\n`;
  if (s.language === "Java") return wrapJava(s.code, method, payload, jsonInput);
  if (s.language === "C") return wrapC(s.code, method, args, jsonInput);
  throw new Error("Unsupported submission language");
}
function wrapJava(source: string, method: string, payload: string, jsonInput: boolean): string {
  return `import java.util.*; import java.lang.reflect.*;\n${source.replace(/public\s+class\s+Solution/, "class Solution")}\n${/class\s+ListNode\b/.test(source) ? "" : "class ListNode {int val; ListNode next; ListNode(int v){val=v;} ListNode(){} ListNode(int v,ListNode n){val=v;next=n;}}"}\n${/class\s+TreeNode\b/.test(source) ? "" : "class TreeNode {int val; TreeNode left,right; TreeNode(int v){val=v;} TreeNode(){} TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}"}\npublic class Main {
  static class Json {String s;int i;Json(String x){s=x;}void ws(){while(i<s.length()&&Character.isWhitespace(s.charAt(i)))i++;}Object read(){ws();char c=s.charAt(i);if(c=='['){i++;List<Object>a=new ArrayList<>();ws();if(s.charAt(i)==']'){i++;return a;}while(true){a.add(read());ws();char end=s.charAt(i++);if(end==']')return a;if(end!=',')throw new IllegalArgumentException("Bad JSON");}}if(c=='"'){i++;StringBuilder b=new StringBuilder();while(s.charAt(i)!='"'){char ch=s.charAt(i++);if(ch=='\\\\'){ch=s.charAt(i++);if(ch=='n')ch='\\n';else if(ch=='t')ch='\\t';else if(ch=='r')ch='\\r';else if(ch=='u'){ch=(char)Integer.parseInt(s.substring(i,i+4),16);i+=4;}}b.append(ch);}i++;return b.toString();}int start=i;while(i<s.length()&&",] \\n".indexOf(s.charAt(i))<0)i++;String v=s.substring(start,i);if(v.equals("null"))return null;if(v.equals("true")||v.equals("false"))return Boolean.valueOf(v);return Double.valueOf(v);}}
  static Object convert(Object v,Class<?> t){if(v==null)return null;if(t==int.class||t==Integer.class)return ((Number)v).intValue();if(t==long.class||t==Long.class)return ((Number)v).longValue();if(t==double.class||t==Double.class)return ((Number)v).doubleValue();if(t==char.class)return v.toString().charAt(0);if(t.isArray()){List<?> l=(List<?>)v;Object a=Array.newInstance(t.getComponentType(),l.size());for(int i=0;i<l.size();i++)Array.set(a,i,convert(l.get(i),t.getComponentType()));return a;}if(t==ListNode.class){ListNode head=null,tail=null;for(Object x:(List<?>)v){ListNode p=new ListNode(((Number)x).intValue());if(head==null)head=p;else tail.next=p;tail=p;}return head;}if(t==TreeNode.class){List<?> l=(List<?>)v;if(l.isEmpty()||l.get(0)==null)return null;TreeNode root=new TreeNode(((Number)l.get(0)).intValue());Queue<TreeNode>q=new ArrayDeque<>();q.add(root);int j=1;while(!q.isEmpty()&&j<l.size()){TreeNode p=q.remove();if(l.get(j)!=null){p.left=new TreeNode(((Number)l.get(j)).intValue());q.add(p.left);}j++;if(j<l.size()&&l.get(j)!=null){p.right=new TreeNode(((Number)l.get(j)).intValue());q.add(p.right);}j++;}return root;}if(v instanceof List<?> l){List<Object>r=new ArrayList<>();for(Object x:l)r.add(x instanceof Number?((Number)x).intValue():x);return r;}return v;}
  static String encode(Object v){if(v==null)return "null";if(v instanceof String||v instanceof Character)return "\\\""+v.toString().replace("\\\\","\\\\\\\\").replace("\\\"","\\\\\\\"").replace("\\n","\\\\n")+"\\\"";if(v instanceof ListNode p){List<Integer>l=new ArrayList<>();while(p!=null&&l.size()<20000){l.add(p.val);p=p.next;}return encode(l);}if(v instanceof TreeNode root){List<Object>l=new ArrayList<>();List<TreeNode>q=new ArrayList<>();q.add(root);for(int i=0;i<q.size()&&i<20000;i++){TreeNode p=q.get(i);l.add(p==null?null:p.val);if(p!=null){q.add(p.left);q.add(p.right);}}while(!l.isEmpty()&&l.get(l.size()-1)==null)l.remove(l.size()-1);return encode(l);}if(v.getClass().isArray()){List<Object>l=new ArrayList<>();for(int i=0;i<Array.getLength(v);i++)l.add(Array.get(v,i));return encode(l);}if(v instanceof Collection<?> l){StringJoiner j=new StringJoiner(",","[","]");for(Object x:l)j.add(encode(x));return j.toString();}return v.toString();}
  public static void main(String[] ignored)throws Exception {List<?> values=(List<?>)new Json(${JSON.stringify(payload)}).read();Method chosen=null;for(Method m:Solution.class.getDeclaredMethods())if(m.getName().equals(${JSON.stringify(method)})&&m.getParameterCount()<=values.size()){if(chosen!=null)throw new IllegalArgumentException("Overloaded methods need a unique entrypoint name");chosen=m;}if(chosen==null)throw new IllegalArgumentException("Method not found");chosen.setAccessible(true);Object[] a=new Object[chosen.getParameterCount()];for(int i=0;i<a.length;i++)a[i]=convert(values.get(i),chosen.getParameterTypes()[i]);Object result=chosen.invoke(Modifier.isStatic(chosen.getModifiers())?null:new Solution(),a);if(chosen.getReturnType()==void.class)result=a[0];String out=encode(result);System.out.println(${jsonInput ? "out" : 'out.startsWith("[")?out.substring(1,out.length()-1).replace(","," "):out'});}
}`;
}
function wrapC(code: string, method: string, args: unknown[], jsonInput: boolean): string {
  const match = code.match(
    new RegExp(`(int|long|double|float|bool|char|void)\\s*(\\*?)\\s*${method}\\s*\\(([^)]*)\\)`),
  );
  if (!match)
    throw new Error(
      "C method mode supports scalar returns, int arrays with returnSize, and strings. Use full-program mode for other signatures.",
    );
  const [, returnType, pointer, params] = match;
  let argIndex = 0,
    lastArraySize = 0;
  const declarations: string[] = [],
    call: string[] = [];
  for (const [index, param] of params
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p !== "void")
    .entries()) {
    const p = param.match(
      /^(?:const\s+)?(int|long|double|float|bool|char)\s*(\*?)\s*(\w+)\s*(?:\[\])?$/,
    );
    if (!p) throw new Error(`C parameter '${param}' needs full-program mode.`);
    const [, type, star, name] = p;
    if (star && /returnSize/i.test(name)) {
      call.push("&__returnSize");
      continue;
    }
    if (!star && /(Size|Length|Len)$/.test(name) && argIndex > 0) {
      call.push(String(lastArraySize));
      continue;
    }
    const value = args[argIndex++];
    if (star || param.endsWith("[]")) {
      if (type === "char" && typeof value === "string") {
        declarations.push(`char __arg${index}[]=${JSON.stringify(value)};`);
        lastArraySize = value.length;
      } else {
        if (
          !Array.isArray(value) ||
          value.some((v) => typeof v !== "number" || !Number.isFinite(v))
        )
          throw new Error(`Parameter ${name} requires a numeric JSON array.`);
        lastArraySize = value.length;
        declarations.push(
          `${type} __arg${index}[${Math.max(1, value.length)}]={${value.join(",") || 0}};`,
        );
      }
      call.push(`__arg${index}`);
    } else {
      if (typeof value !== "number" && typeof value !== "boolean")
        throw new Error(`Parameter ${name} requires a number or boolean.`);
      call.push(String(Number(value)));
    }
  }
  let output = "";
  const invoke = `${method}(${call.join(",")})`;
  if (returnType === "void") output = `${invoke};puts("null");`;
  else if (pointer && returnType === "int")
    output = `int* __result=${invoke};${jsonInput ? 'printf("[");' : ""}for(int i=0;i<__returnSize;i++)printf("%s%d",i?"${jsonInput ? "," : " "}":"",__result[i]);${jsonInput ? 'printf("]");' : ""}printf("\\n");`;
  else if (pointer && returnType === "char")
    output = `char* __result=${invoke};printf("%s\\n",__result);`;
  else if (pointer) throw new Error("This pointer return type needs full-program mode.");
  else
    output = `${returnType} __result=${invoke};${returnType === "bool" ? 'puts(__result?"true":"false");' : `printf("${returnType === "double" || returnType === "float" ? "%g" : returnType === "long" ? "%ld" : "%d"}\\n",__result);`}`;
  return `#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n${code}\nint main(void){int __returnSize=0;${declarations.join("\n")}${output}return 0;}`;
}
