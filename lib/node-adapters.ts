export function wrapJavaScript(code: string, method: string, args: unknown[], json: boolean) {
  const names =
    code
      .match(
        new RegExp(
          `(?:function\\s+${method}|${method}\\s*=\\s*(?:function\\s*)?|${method})\\s*\\(([^)]*)\\)`,
        ),
      )?.[1]
      .split(",")
      .map((x) => x.trim()) || [];
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return `${/\b(?:class|function)\s+ListNode\b/.test(clean) ? "" : "class ListNode { constructor(val=0,next=null){this.val=val;this.next=next;} }"}\n${/\b(?:class|function)\s+TreeNode\b/.test(clean) ? "" : "class TreeNode { constructor(val=0,left=null,right=null){this.val=val;this.left=left;this.right=right;} }"}\n${code}
const __args=${JSON.stringify(args)},__names=${JSON.stringify(names)};
for(let i=0;i<__args.length;i++){if(['head','head1','head2','l1','l2'].includes(__names[i])){let p=null;for(const v of [...(__args[i]||[])].reverse())p=new ListNode(v,p);__args[i]=p;}else if(__names[i]==='root'){const a=__args[i]||[],root=a.length&&a[0]!==null?new TreeNode(a[0]):null,q=root?[root]:[];let j=1;for(const p of q)for(const side of ['left','right']){if(j<a.length&&a[j]!==null){p[side]=new TreeNode(a[j]);q.push(p[side]);}j++;}__args[i]=root;}}
const __instance=typeof Solution!=='undefined'?new Solution():null;const __fn=typeof ${method}==='function'?${method}:__instance?.[${JSON.stringify(method)}]?.bind(__instance);if(!__fn)throw new Error('Method not found');
function __encode(v){if(v instanceof ListNode){const a=[];while(v&&a.length<20000){a.push(v.val);v=v.next;}return a;}if(v instanceof TreeNode){const a=[],q=[v];for(let i=0;i<q.length&&i<20000;i++){const p=q[i];a.push(p?p.val:null);if(p)q.push(p.left,p.right);}while(a.length&&a[a.length-1]===null)a.pop();return a;}return v;}
Promise.resolve(__fn(...__args)).then(v=>{v=__encode(v===undefined?__args[0]:v);console.log(${json ? "JSON.stringify(v)" : "Array.isArray(v)?v.join(' '):String(v)"});});`;
}
export function wrapCNodes(code: string, method: string, args: unknown[]): string {
  const signature = code.match(
    new RegExp(
      `(struct\\s+(?:ListNode|TreeNode)|int|long|bool|void)\\s*(\\*?)\\s*${method}\\s*\\(([^)]*)\\)`,
    ),
  );
  if (!signature) throw new Error("Unsupported C node signature. Use a full stdin program.");
  const [, resultType, pointer, params] = signature;
  const declarations: string[] = [],
    call: string[] = [];
  params.split(",").forEach((param, i) => {
    const type = param.match(/struct\s+(ListNode|TreeNode)\s*\*\s*\w+/)?.[1];
    const value = args[i];
    if (type) {
      if (
        value !== null &&
        (!Array.isArray(value) ||
          value.some(
            (v) => v !== null && (!Number.isSafeInteger(v) || Math.abs(v as number) > 2147483647),
          ))
      )
        throw new Error("Node arguments must be integer arrays with optional null tree children.");
      const vals = (value || []) as (number | null)[];
      declarations.push(
        `int a${i}[]={${vals.map((v) => v ?? 0).join(",") || 0}},valid${i}[]={${vals.map((v) => (v === null ? 0 : 1)).join(",") || 0}};struct ${type}* p${i}=${type === "ListNode" ? `makeList(a${i},${vals.length})` : `makeTree(a${i},valid${i},${vals.length})`};`,
      );
      call.push(`p${i}`);
    } else {
      if (
        !/^\s*(int|long|bool)\s+\w+\s*$/.test(param) ||
        (typeof value !== "number" && typeof value !== "boolean")
      )
        throw new Error("Unsupported C node parameter. Use a full program.");
      call.push(String(Number(value)));
    }
  });
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "");
  const definitions = `${/struct\s+ListNode\s*\{/.test(clean) ? "" : "struct ListNode{int val;struct ListNode* next;};"}\n${/struct\s+TreeNode\s*\{/.test(clean) ? "" : "struct TreeNode{int val;struct TreeNode* left;struct TreeNode* right;};"}`;
  const invocation = `${method}(${call.join(",")})`;
  const output =
    pointer && /ListNode/.test(resultType)
      ? `printList(${invocation});`
      : pointer && /TreeNode/.test(resultType)
        ? `printTree(${invocation});`
        : resultType === "void"
          ? `${invocation};puts("null");`
          : resultType === "bool"
            ? `puts(${invocation}?"true":"false");`
            : `printf("${resultType === "long" ? "%ld" : "%d"}\\n",${invocation});`;
  return `#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n${definitions}\n${code}
struct ListNode* makeList(int*a,int n){struct ListNode *head=NULL,*tail=NULL;for(int i=0;i<n;i++){struct ListNode*p=calloc(1,sizeof(*p));p->val=a[i];if(tail)tail->next=p;else head=p;tail=p;}return head;}
struct TreeNode* makeTree(int*a,int*valid,int n){if(!n||!valid[0])return NULL;struct TreeNode**q=calloc(n+1,sizeof(*q));int head=0,tail=1,j=1;q[0]=calloc(1,sizeof(**q));q[0]->val=a[0];struct TreeNode*root=q[0];while(head<tail&&j<n){struct TreeNode*p=q[head++];if(valid[j]){p->left=calloc(1,sizeof(*p));p->left->val=a[j];q[tail++]=p->left;}j++;if(j<n&&valid[j]){p->right=calloc(1,sizeof(*p));p->right->val=a[j];q[tail++]=p->right;}j++;}free(q);return root;}
void printList(struct ListNode*p){printf("[");int n=0;while(p&&n<20000){printf("%s%d",n?",":"",p->val);n++;p=p->next;}puts("]");}
void printTree(struct TreeNode*p){if(!p){puts("null");return;}struct TreeNode**q=calloc(40001,sizeof(*q));int head=0,tail=1,last=0;q[0]=p;while(head<tail&&tail<39999){struct TreeNode*v=q[head++];if(v){last=head-1;q[tail++]=v->left;q[tail++]=v->right;}}printf("[");for(int i=0;i<=last;i++){if(i)printf(",");if(q[i])printf("%d",q[i]->val);else printf("null");}puts("]");free(q);}
int main(void){${declarations.join("\n")}${output}return 0;}`;
}
