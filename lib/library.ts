import { Algorithm, PRESETS, COLORS, analyzeCode } from "./algorithms";
export const LANGUAGES = ["JavaScript", "Python", "Java", "C"] as const;
export type Language = (typeof LANGUAGES)[number];
export function analyzeLibraryCode(code: string, name: string, language: string) {
  if (LANGUAGES.includes(language as Language)) {
    const match = PRESETS.find((a) => codeFor(a, language as Language).trim() === code.trim());
    if (match)
      return {
        algorithm: { ...match, name: name || match.name, code, language },
        confidence: "preset" as const,
        notes: ["Exact match to a reviewed library implementation.", match.explanation],
      };
  }
  return analyzeCode(code, name, language);
}
// All complete-program templates read: n, then n integers, then an optional target.
const pythonBodies: Record<string, string> = {
  insertion: `for i in range(1, len(a)):\n    key, j = a[i], i - 1\n    while j >= 0 and a[j] > key:\n        a[j + 1] = a[j]\n        j -= 1\n    a[j + 1] = key\nprint(*a)`,
  selection: `for i in range(len(a)):\n    k = i\n    for j in range(i + 1, len(a)):\n        if a[j] < a[k]: k = j\n    a[i], a[k] = a[k], a[i]\nprint(*a)`,
  bubble: `for i in range(len(a) - 1):\n    swapped = False\n    for j in range(len(a) - i - 1):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\n            swapped = True\n    if not swapped: break\nprint(*a)`,
  merge: `def merge_sort(a):\n    if len(a) <= 1: return a\n    m = len(a) // 2\n    l, r = merge_sort(a[:m]), merge_sort(a[m:])\n    out, i, j = [], 0, 0\n    while i < len(l) and j < len(r):\n        if l[i] <= r[j]:\n            out.append(l[i]); i += 1\n        else:\n            out.append(r[j]); j += 1\n    return out + l[i:] + r[j:]\nprint(*merge_sort(a))`,
  linear: `answer = -1\nfor i, value in enumerate(a):\n    if value == target:\n        answer = i; break\nprint(answer)`,
  binary: `lo, hi, answer = 0, len(a) - 1, -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if a[mid] == target:\n        answer = mid; break\n    if a[mid] < target: lo = mid + 1\n    else: hi = mid - 1\nprint(answer)`,
};
const cBodies: Record<string, string> = {
  insertion: `for(int i=1;i<n;i++){ int key=a[i],j=i-1; while(j>=0 && a[j]>key){a[j+1]=a[j];j--;} a[j+1]=key; }`,
  selection: `for(int i=0;i<n;i++){int k=i;for(int j=i+1;j<n;j++)if(a[j]<a[k])k=j;int t=a[i];a[i]=a[k];a[k]=t;}`,
  bubble: `for(int i=0;i<n-1;i++){int swapped=0;for(int j=0;j<n-i-1;j++)if(a[j]>a[j+1]){int t=a[j];a[j]=a[j+1];a[j+1]=t;swapped=1;}if(!swapped)break;}`,
  merge: `for(int width=1;width<n;width*=2){for(int start=0;start<n;start+=2*width){int mid=start+width<n?start+width:n,end=start+2*width<n?start+2*width:n;int i=start,j=mid,k=start;while(i<mid&&j<end)temp[k++]=a[i]<=a[j]?a[i++]:a[j++];while(i<mid)temp[k++]=a[i++];while(j<end)temp[k++]=a[j++];for(k=start;k<end;k++)a[k]=temp[k];}}`,
  linear: `int answer=-1;for(int i=0;i<n;i++)if(a[i]==target){answer=i;break;}printf("%d\\n",answer);`,
  binary: `int lo=0,hi=n-1,answer=-1;while(lo<=hi){int mid=lo+(hi-lo)/2;if(a[mid]==target){answer=mid;break;}if(a[mid]<target)lo=mid+1;else hi=mid-1;}printf("%d\\n",answer);`,
};
const javaBodies: Record<string, string> = {
  insertion: `for (int i=1;i<n;i++) { int key=a[i],j=i-1; while(j>=0 && a[j]>key){a[j+1]=a[j];j--;} a[j+1]=key; }`,
  selection: `for(int i=0;i<n;i++){int k=i;for(int j=i+1;j<n;j++)if(a[j]<a[k])k=j;int t=a[i];a[i]=a[k];a[k]=t;}`,
  bubble: `for(int i=0;i<n-1;i++){boolean swapped=false;for(int j=0;j<n-i-1;j++)if(a[j]>a[j+1]){int t=a[j];a[j]=a[j+1];a[j+1]=t;swapped=true;}if(!swapped)break;}`,
  merge: `int[] temp=new int[n];for(int width=1;width<n;width*=2){for(int start=0;start<n;start+=2*width){int mid=Math.min(start+width,n),end=Math.min(start+2*width,n),i=start,j=mid,k=start;while(i<mid&&j<end)temp[k++]=a[i]<=a[j]?a[i++]:a[j++];while(i<mid)temp[k++]=a[i++];while(j<end)temp[k++]=a[j++];for(k=start;k<end;k++)a[k]=temp[k];}}`,
  linear: `int answer=-1;for(int i=0;i<n;i++)if(a[i]==target){answer=i;break;}System.out.println(answer);`,
  binary: `int lo=0,hi=n-1,answer=-1;while(lo<=hi){int mid=lo+(hi-lo)/2;if(a[mid]==target){answer=mid;break;}if(a[mid]<target)lo=mid+1;else hi=mid-1;}System.out.println(answer);`,
};
export function codeFor(a: Algorithm, language: Language): string {
  if (language === "JavaScript") return PRESETS.find((p) => p.id === a.id)?.code || a.code;
  const id = a.id;
  if (language === "Python")
    return `# Input: n, n space-separated integers, optional target\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:n+1]\ntarget = data[n+1] if len(data) > n+1 else 0\n\n${pythonBodies[id] || "print(*a)"}\n`;
  if (language === "C")
    return `// Input: n, n integers, optional target\n#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n  int n, target=0;\n  if(scanf("%d", &n)!=1 || n<0 || n>20000) return 1;\n  int *a=malloc((n+1)*sizeof(int)), *temp=malloc((n+1)*sizeof(int));\n  if(!a || !temp) return 1;\n  for(int i=0;i<n;i++) if(scanf("%d", &a[i])!=1) return 1;\n  scanf("%d", &target);\n  ${cBodies[id] || ""}\n  ${id === "linear" || id === "binary" ? "" : 'for(int i=0;i<n;i++) printf("%d%s",a[i],i+1<n?" ":"\\n");'}\n  free(a); free(temp);\n  return 0;\n}\n`;
  return `// Input: n, n integers, optional target\nimport java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc=new Scanner(System.in);\n    int n=sc.nextInt();\n    int[] a=new int[n];\n    for(int i=0;i<n;i++) a[i]=sc.nextInt();\n    int target=sc.hasNextInt()?sc.nextInt():0;\n    ${javaBodies[id] || ""}\n    ${id === "linear" || id === "binary" ? "" : 'for(int i=0;i<n;i++) System.out.print(a[i]+(i+1<n?" ":"\\n"));'}\n  }\n}\n`;
}
export type Structure = {
  name: string;
  tag: string;
  description: string;
  access: string;
  search: string;
  insert: string;
  remove: string;
  space: string;
  notes: string;
  samples: Record<Language, string>;
};
export const STRUCTURES: Structure[] = [
  {
    name: "Array",
    tag: "Linear",
    description: "Contiguous elements with fast indexed access.",
    access: "O(1)",
    search: "O(n)",
    insert: "O(n)",
    remove: "O(n)",
    space: "O(n)",
    notes:
      "Insertion and deletion refer to an arbitrary index. Dynamic-array append is amortized O(1), worst O(n).",
    samples: {
      JavaScript: "const a = [3, 1, 4];\na.push(2);\nconsole.log(a[0], a);",
      Python: "a = [3, 1, 4]\na.append(2)\nprint(a[0], a)",
      Java: "ArrayList<Integer> a = new ArrayList<>(List.of(3, 1, 4)); a.add(2); System.out.println(a.get(0));",
      C: 'int a[4]={3,1,4,2}; printf("%d\\n", a[0]);',
    },
  },
  {
    name: "Linked list",
    tag: "Linear",
    description: "Nodes connected by references; flexible insertion.",
    access: "O(n)",
    search: "O(n)",
    insert: "O(1)*",
    remove: "O(1)*",
    space: "O(n)",
    notes:
      "O(1) insertion/deletion requires the relevant node and predecessor (or doubly linked nodes); finding them costs O(n).",
    samples: {
      JavaScript:
        "const head = { value: 3, next: { value: 5, next: null } };\nfor(let p=head; p; p=p.next) console.log(p.value);",
      Python:
        "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\nhead = Node(3, Node(5))\nwhile head:\n    print(head.value)\n    head = head.next",
      Java: "LinkedList<Integer> list=new LinkedList<>(); list.addFirst(3); list.addLast(5); System.out.println(list);",
      C: 'struct Node {int value; struct Node *next;}; struct Node b={5,NULL},a={3,&b}; for(struct Node *p=&a;p;p=p->next)printf("%d\\n",p->value);',
    },
  },
  {
    name: "Stack",
    tag: "Linear",
    description: "Last in, first out. Useful for DFS and undo.",
    access: "O(1)*",
    search: "O(n)",
    insert: "O(1)*",
    remove: "O(1)",
    space: "O(n)",
    notes: "Access means peek. Dynamic-array push is amortized O(1).",
    samples: {
      JavaScript: "const stack=[]; stack.push(3,5); console.log(stack.pop());",
      Python: "stack=[]\nstack.extend([3,5])\nprint(stack.pop())",
      Java: "Deque<Integer> stack=new ArrayDeque<>(); stack.push(3); stack.push(5); System.out.println(stack.pop());",
      C: 'int stack[10],top=0; stack[top++]=3; stack[top++]=5; printf("%d\\n",stack[--top]);',
    },
  },
  {
    name: "Queue",
    tag: "Linear",
    description: "First in, first out. The foundation of BFS.",
    access: "O(1)",
    search: "O(n)",
    insert: "O(1)*",
    remove: "O(1)",
    space: "O(n)",
    notes:
      "Assumes a linked queue or circular buffer. JavaScript Array.shift is O(n); use a head index instead.",
    samples: {
      JavaScript: "const queue=[]; let head=0; queue.push(3,5); console.log(queue[head++]);",
      Python: "from collections import deque\nq=deque([3,5])\nprint(q.popleft())",
      Java: "Queue<Integer> q=new ArrayDeque<>(); q.add(3); q.add(5); System.out.println(q.remove());",
      C: 'int q[10],head=0,tail=0; q[tail++]=3; q[tail++]=5; printf("%d\\n",q[head++]);',
    },
  },
  {
    name: "Hash table",
    tag: "Hashing",
    description: "Key-value lookup with average constant cost.",
    access: "O(1) avg",
    search: "O(1) avg",
    insert: "O(1) avg",
    remove: "O(1) avg",
    space: "O(n)",
    notes:
      "Worst-case operations can be O(n) with collisions; implementation and hashing assumptions matter. Hash sets share these costs.",
    samples: {
      JavaScript: "const map=new Map(); map.set('apple',3); console.log(map.get('apple'));",
      Python: "counts={'apple':3}\ncounts['pear']=5\nprint(counts['apple'])",
      Java: 'Map<String,Integer> map=new HashMap<>(); map.put("apple",3); System.out.println(map.get("apple"));',
      C: '// Direct-address hash table for keys 0..99\nint table[100]={0}; table[42]=3; printf("%d\\n",table[42]);',
    },
  },
  {
    name: "Binary search tree",
    tag: "Trees",
    description: "Ordered nodes for search, insertion, and traversal.",
    access: "O(h)",
    search: "O(h)",
    insert: "O(h)",
    remove: "O(h)",
    space: "O(n)",
    notes:
      "Height h is O(log n) when balanced and O(n) when skewed. TreeSet is a balanced implementation.",
    samples: {
      JavaScript:
        "const root={value:5,left:{value:3,left:null,right:null},right:null};\nfunction inorder(t){if(!t)return; inorder(t.left); console.log(t.value); inorder(t.right);}\ninorder(root);",
      Python:
        "class Node:\n    def __init__(self,x,left=None,right=None): self.x,self.left,self.right=x,left,right\ndef inorder(t):\n    if t:\n        inorder(t.left); print(t.x); inorder(t.right)\ninorder(Node(5,Node(3)))",
      Java: "TreeSet<Integer> tree=new TreeSet<>(); tree.add(5); tree.add(3); System.out.println(tree);",
      C: 'struct Node {int x;struct Node *left,*right;}; struct Node l={3,NULL,NULL},r={5,&l,NULL}; printf("%d %d\\n",r.left->x,r.x);',
    },
  },
  {
    name: "Binary heap",
    tag: "Trees",
    description: "A priority queue with fast minimum access.",
    access: "O(1) min",
    search: "O(n)",
    insert: "O(log n)",
    remove: "O(log n)",
    space: "O(n)",
    notes:
      "Building a heap is O(n). Removal means extracting the root. Arbitrary lookup is linear.",
    samples: {
      JavaScript:
        "const heap=[];\nfunction push(x){heap.push(x);let i=heap.length-1;while(i>0){let p=(i-1)>>1;if(heap[p]<=heap[i])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}}\n[5,3,7].forEach(push);console.log(heap[0]);",
      Python: "import heapq\nh=[5,3,7]\nheapq.heapify(h)\nprint(heapq.heappop(h))",
      Java: "PriorityQueue<Integer> heap=new PriorityQueue<>(); heap.addAll(List.of(5,3,7)); System.out.println(heap.poll());",
      C: 'int heap[10],size=0,values[]={5,3,7};for(int k=0;k<3;k++){int i=size++;heap[i]=values[k];while(i>0){int p=(i-1)/2;if(heap[p]<=heap[i])break;int t=heap[p];heap[p]=heap[i];heap[i]=t;i=p;}}printf("%d\\n",heap[0]);',
    },
  },
  {
    name: "Graph",
    tag: "Graphs",
    description: "Vertices and edges, represented by adjacency lists.",
    access: "O(1) vertex",
    search: "O(V + E)",
    insert: "O(1)*",
    remove: "O(V + E)*",
    space: "O(V + E)",
    notes:
      "Search means BFS/DFS traversal. Edge insertion is amortized O(1); vertex deletion may touch all edges.",
    samples: {
      JavaScript:
        "const graph=[[1,2],[0],[0]]; const seen=new Set([0]),q=[0];\nfor(let i=0;i<q.length;i++){const v=q[i];console.log(v);for(const w of graph[v])if(!seen.has(w)){seen.add(w);q.push(w);}}",
      Python:
        "from collections import deque\ng=[[1,2],[0],[0]]\nseen={0};q=deque([0])\nwhile q:\n    v=q.popleft();print(v)\n    for w in g[v]:\n        if w not in seen: seen.add(w);q.append(w)",
      Java: "int[][] g={{1,2},{0},{0}}; boolean[] seen=new boolean[3]; Queue<Integer> q=new ArrayDeque<>();q.add(0);seen[0]=true;while(!q.isEmpty()){int v=q.remove();System.out.println(v);for(int w:g[v])if(!seen[w]){seen[w]=true;q.add(w);}}",
      C: 'int g[3][3]={{0,1,1},{1,0,0},{1,0,0}},seen[3]={1,0,0},q[3]={0},head=0,tail=1;while(head<tail){int v=q[head++];printf("%d\\n",v);for(int w=0;w<3;w++)if(g[v][w]&&!seen[w]){seen[w]=1;q[tail++]=w;}}',
    },
  },
  {
    name: "Trie",
    tag: "Trees",
    description: "A prefix tree for strings and autocomplete.",
    access: "O(L)",
    search: "O(L)",
    insert: "O(L)",
    remove: "O(L)",
    space: "O(total L)",
    notes:
      "L is the key length, not the number of keys. Child lookup assumes a bounded alphabet or average constant-time hashing.",
    samples: {
      JavaScript:
        "const root={};for(const word of ['cat','car']){let node=root;for(const ch of word)node=node[ch]??={};node.end=true;}console.log(root.c.a.t.end);",
      Python:
        "root={}\nfor word in ['cat','car']:\n    node=root\n    for ch in word: node=node.setdefault(ch,{})\n    node['$']=True\nprint(root['c']['a']['t']['$'])",
      Java: "class Node{Map<Character,Node> next=new HashMap<>();boolean end;} Node root=new Node();for(String word:List.of(\"cat\",\"car\")){Node p=root;for(char ch:word.toCharArray())p=p.next.computeIfAbsent(ch,k->new Node());p.end=true;}System.out.println(root.next.get('c').next.get('a').next.get('t').end);",
      C: 'int trie[16][26]={{0}},end[16]={0},used=1;char *words[]={"cat","car"};for(int k=0;k<2;k++){int p=0;for(int j=0;words[k][j];j++){int c=words[k][j]-\'a\';if(!trie[p][c])trie[p][c]=used++;p=trie[p][c];}end[p]=1;}printf("%d\\n",end[trie[trie[trie[0][2]][0]][19]]);',
    },
  },
  {
    name: "Disjoint set",
    tag: "Graphs",
    description: "Union-find tracks connected components.",
    access: "O(α(n))*",
    search: "O(α(n))*",
    insert: "O(α(n))*",
    remove: "Unsupported",
    space: "O(n)",
    notes:
      "Amortized inverse-Ackermann cost assumes path compression and union by rank/size. Basic versions can be linear.",
    samples: {
      JavaScript:
        "const p=[0,1,2],size=[1,1,1];function find(x){return p[x]===x?x:p[x]=find(p[x]);}function union(a,b){a=find(a);b=find(b);if(a===b)return;if(size[a]<size[b])[a,b]=[b,a];p[b]=a;size[a]+=size[b];}union(0,1);console.log(find(0)===find(1));",
      Python:
        "p=list(range(3));size=[1]*3\ndef find(x):\n    if p[x]!=x:p[x]=find(p[x])\n    return p[x]\ndef union(a,b):\n    a,b=find(a),find(b)\n    if a==b:return\n    if size[a]<size[b]:a,b=b,a\n    p[b]=a;size[a]+=size[b]\nunion(0,1)\nprint(find(0)==find(1))",
      Java: "int[] p={0,1,2}; int[] size={1,1,1}; int a=0,b=1;while(p[a]!=a){p[a]=p[p[a]];a=p[a];}while(p[b]!=b){p[b]=p[p[b]];b=p[b];}if(size[a]<size[b]){int t=a;a=b;b=t;}p[b]=a;size[a]+=size[b];System.out.println(p[0]==p[1]);",
      C: 'int p[]={0,1,2},size[]={1,1,1},a=0,b=1;while(p[a]!=a){p[a]=p[p[a]];a=p[a];}while(p[b]!=b){p[b]=p[p[b]];b=p[b];}if(size[a]<size[b]){int t=a;a=b;b=t;}p[b]=a;size[a]+=size[b];printf("%d\\n",p[0]==p[1]);',
    },
  },
];
export function structureCode(s: Structure, language: Language) {
  const code = s.samples[language];
  if (language === "Java")
    return `import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    ${code}\n  }\n}`;
  if (language === "C")
    return `#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n  ${code}\n  return 0;\n}`;
  return code;
}
export function structureAlgorithm(s: Structure, language: Language): Algorithm {
  return {
    id: `ds-${Date.now()}`,
    name: s.name + " demo",
    language,
    code: structureCode(s, language),
    color: COLORS[0],
    model: { best: "constant", average: "constant", worst: "constant" },
    factors: { best: 1, average: 1, worst: 1 },
    overhead: 0,
    space: s.space,
    explanation:
      "Fixed-size demonstration. This code does not scale with n. Edit it to consume your input and set the corresponding model.",
    origin: "manual",
    conditions: {
      best: "Fixed example, independent of n.",
      average: "Fixed example, independent of n.",
      worst: "Fixed example, independent of n.",
    },
  };
}
