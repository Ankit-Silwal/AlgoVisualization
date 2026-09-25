import type { Structure } from "./library";
export const EXTRA_STRUCTURES: Structure[] = [
  {
    name: "Deque",
    tag: "Linear",
    description: "Insert and remove at either end.",
    access: "O(1) ends",
    search: "O(n)",
    insert: "O(1)*",
    remove: "O(1)",
    space: "O(n)",
    notes:
      "A linked deque or circular buffer supports both ends. Dynamic buffer growth makes insertion amortized O(1).",
    samples: {
      JavaScript:
        "const a=[3,5];let front={value:1,next:null};front.next={value:a[0],next:{value:a[1],next:null}};console.log(front.value,front.next.value);",
      Python:
        "from collections import deque\nd=deque([3,5]);d.appendleft(1);d.append(7)\nprint(d.popleft(),d.pop())",
      Java: 'Deque<Integer>d=new ArrayDeque<>();d.add(3);d.addFirst(1);d.addLast(7);System.out.println(d.removeFirst()+" "+d.removeLast());',
      C: 'int d[8],h=2,t=2;d[t++]=3;d[--h]=1;d[t++]=7;printf("%d %d\\n",d[h++],d[--t]);',
    },
  },
  {
    name: "Doubly linked list",
    tag: "Linear",
    description: "Each node points to both its predecessor and successor.",
    access: "O(n)",
    search: "O(n)",
    insert: "O(1)*",
    remove: "O(1)*",
    space: "O(n)",
    notes: "Constant-time unlink requires a reference to the node. Finding it costs O(n).",
    samples: {
      JavaScript:
        "const a={value:3,prev:null,next:null},b={value:5,prev:a,next:null};a.next=b;console.log(a.next.value,b.prev.value);",
      Python:
        "class Node:\n    def __init__(self,x):self.x=x;self.prev=None;self.next=None\na,b=Node(3),Node(5);a.next=b;b.prev=a\nprint(a.next.x,b.prev.x)",
      Java: "LinkedList<Integer>l=new LinkedList<>();l.add(3);l.add(5);ListIterator<Integer>it=l.listIterator(l.size());while(it.hasPrevious())System.out.println(it.previous());",
      C: 'struct Node{int x;struct Node *prev,*next;};struct Node a={3,NULL,NULL},b={5,&a,NULL};a.next=&b;printf("%d %d\\n",a.next->x,b.prev->x);',
    },
  },
  {
    name: "Circular queue",
    tag: "Linear",
    description: "A bounded FIFO buffer that wraps around its storage.",
    access: "O(1) front",
    search: "O(n)",
    insert: "O(1)",
    remove: "O(1)",
    space: "O(capacity)",
    notes:
      "Enqueue rejects a full buffer; dequeue rejects an empty one. Head/tail wrap modulo capacity.",
    samples: {
      JavaScript:
        "const q=Array(4);let head=0,size=0;for(const x of [3,5,7])q[(head+size++)%4]=x;console.log(q[head]);head=(head+1)%4;size--;q[(head+size++)%4]=9;console.log(Array.from({length:size},(_,i)=>q[(head+i)%4]).join(' '));",
      Python:
        "q=[None]*4;head=size=0\nfor x in [3,5,7]:q[(head+size)%4]=x;size+=1\nprint(q[head]);head=(head+1)%4;size-=1\nq[(head+size)%4]=9;size+=1\nprint(*[q[(head+i)%4] for i in range(size)])",
      Java: "int[]q=new int[4];int head=0,size=0;for(int x:new int[]{3,5,7})q[(head+size++)%4]=x;System.out.println(q[head]);head=(head+1)%4;size--;q[(head+size++)%4]=9;for(int i=0;i<size;i++)System.out.println(q[(head+i)%4]);",
      C: 'int q[4],head=0,size=0,x[]={3,5,7};for(int i=0;i<3;i++)q[(head+size++)%4]=x[i];printf("%d\\n",q[head]);head=(head+1)%4;size--;q[(head+size++)%4]=9;for(int i=0;i<size;i++)printf("%d ",q[(head+i)%4]);',
    },
  },
  {
    name: "Hash set",
    tag: "Hashing",
    description: "Unique keys with efficient membership checks.",
    access: "Not indexed",
    search: "O(1) avg",
    insert: "O(1) avg",
    remove: "O(1) avg",
    space: "O(n)",
    notes:
      "Expected costs assume suitable hashing and load factor. Worst-case collisions can make operations linear. The C demo uses bounded integer keys and linear probing.",
    samples: {
      JavaScript: "const s=new Set([3,5,3]);s.add(7);s.delete(5);console.log(s.has(3),s.size);",
      Python: "s={3,5,3};s.add(7);s.remove(5)\nprint(3 in s,len(s))",
      Java: 'Set<Integer>s=new HashSet<>(List.of(3,5,3));s.add(7);s.remove(5);System.out.println(s.contains(3)+" "+s.size());',
      C: 'int used[11]={0},keys[11]={0},values[]={3,5,3};for(int i=0;i<3;i++){int p=values[i]%11;while(used[p]&&keys[p]!=values[i])p=(p+1)%11;used[p]=1;keys[p]=values[i];}int p=3%11;while(used[p]&&keys[p]!=3)p=(p+1)%11;printf("%d\\n",used[p]);',
    },
  },
  {
    name: "Fenwick tree",
    tag: "Range queries",
    description: "Compact prefix sums with logarithmic point updates.",
    access: "O(log n)",
    search: "O(log n)*",
    insert: "O(log n) update",
    remove: "O(log n) update",
    space: "O(n)",
    notes:
      "Update adds a delta at a fixed index; query returns a prefix sum. Search refers to prefix-sum selection with nonnegative values, not arbitrary key search.",
    samples: {
      JavaScript:
        "const a=[3,1,4,2],bit=Array(a.length+1).fill(0);function add(i,v){for(i++;i<bit.length;i+=i&-i)bit[i]+=v;}function sum(i){let r=0;for(i++;i>0;i-=i&-i)r+=bit[i];return r;}a.forEach((v,i)=>add(i,v));console.log(sum(2));add(1,5);console.log(sum(2));",
      Python:
        "a=[3,1,4,2];bit=[0]*(len(a)+1)\ndef add(i,v):\n    i+=1\n    while i<len(bit):bit[i]+=v;i+=i&-i\ndef query(i):\n    r=0;i+=1\n    while i>0:r+=bit[i];i-=i&-i\n    return r\nfor i,v in enumerate(a):add(i,v)\nprint(query(2));add(1,5);print(query(2))",
      Java: "int[]a={3,1,4,2},bit=new int[5];for(int k=0;k<a.length;k++)for(int i=k+1;i<bit.length;i+=i&-i)bit[i]+=a[k];int sum=0;for(int i=3;i>0;i-=i&-i)sum+=bit[i];System.out.println(sum);",
      C: 'int a[]={3,1,4,2},bit[5]={0};for(int k=0;k<4;k++)for(int i=k+1;i<5;i+=i&-i)bit[i]+=a[k];int sum=0;for(int i=3;i>0;i-=i&-i)sum+=bit[i];printf("%d\\n",sum);',
    },
  },
  {
    name: "Segment tree",
    tag: "Range queries",
    description: "Range aggregation and point updates in a binary tree.",
    access: "O(log n)",
    search: "O(log n) query",
    insert: "O(log n) update",
    remove: "O(log n) update",
    space: "O(n)",
    notes:
      "This version stores range sums at a fixed array length. Build is O(n); range updates need lazy propagation to stay logarithmic.",
    samples: {
      JavaScript:
        "const a=[3,1,4,2],n=a.length,t=Array(n*2).fill(0);for(let i=0;i<n;i++)t[n+i]=a[i];for(let i=n-1;i>0;i--)t[i]=t[i*2]+t[i*2+1];function query(l,r){let s=0;for(l+=n,r+=n;l<r;l>>=1,r>>=1){if(l&1)s+=t[l++];if(r&1)s+=t[--r];}return s;}console.log(query(1,4));",
      Python:
        "a=[3,1,4,2];n=len(a);t=[0]*n+a\nfor i in range(n-1,0,-1):t[i]=t[i*2]+t[i*2+1]\ndef query(l,r):\n    l+=n;r+=n;s=0\n    while l<r:\n        if l&1:s+=t[l];l+=1\n        if r&1:r-=1;s+=t[r]\n        l//=2;r//=2\n    return s\nprint(query(1,4))",
      Java: "int[]a={3,1,4,2};int n=a.length;int[]t=new int[n*2];for(int i=0;i<n;i++)t[n+i]=a[i];for(int i=n-1;i>0;i--)t[i]=t[i*2]+t[i*2+1];int sum=0;for(int l=n+1,r=n+4;l<r;l>>=1,r>>=1){if((l&1)>0)sum+=t[l++];if((r&1)>0)sum+=t[--r];}System.out.println(sum);",
      C: 'int a[]={3,1,4,2},n=4,t[8]={0};for(int i=0;i<n;i++)t[n+i]=a[i];for(int i=n-1;i>0;i--)t[i]=t[i*2]+t[i*2+1];int sum=0;for(int l=n+1,r=n+4;l<r;l>>=1,r>>=1){if(l&1)sum+=t[l++];if(r&1)sum+=t[--r];}printf("%d\\n",sum);',
    },
  },
  {
    name: "Sparse table",
    tag: "Range queries",
    description: "Precomputed power-of-two intervals for immutable range minima.",
    access: "O(1) query",
    search: "O(1) RMQ",
    insert: "Rebuild",
    remove: "Rebuild",
    space: "O(n log n)",
    notes:
      "Build takes O(n log n). O(1) query applies to idempotent operations such as minimum; sums need a different strategy. Updates require rebuilding.",
    samples: {
      JavaScript:
        "const a=[3,1,4,2],t=[a];for(let k=1;(1<<k)<=a.length;k++)t[k]=a.map((_,i)=>i+(1<<k)<=a.length?Math.min(t[k-1][i],t[k-1][i+(1<<(k-1))]):null);const l=1,r=3,k=Math.floor(Math.log2(r-l+1));console.log(Math.min(t[k][l],t[k][r-(1<<k)+1]));",
      Python:
        "a=[3,1,4,2];t=[a];k=1\nwhile 1<<k<=len(a):\n    t.append([min(t[k-1][i],t[k-1][i+(1<<(k-1))]) for i in range(len(a)-(1<<k)+1)]);k+=1\nl,r=1,3;k=(r-l+1).bit_length()-1\nprint(min(t[k][l],t[k][r-(1<<k)+1]))",
      Java: "int[]a={3,1,4,2};int[][]t=new int[3][4];t[0]=a;for(int k=1;(1<<k)<=4;k++)for(int i=0;i+(1<<k)<=4;i++)t[k][i]=Math.min(t[k-1][i],t[k-1][i+(1<<(k-1))]);int l=1,r=3,k=31-Integer.numberOfLeadingZeros(r-l+1);System.out.println(Math.min(t[k][l],t[k][r-(1<<k)+1]));",
      C: 'int a[]={3,1,4,2},t[3][4]={0};for(int i=0;i<4;i++)t[0][i]=a[i];for(int k=1;(1<<k)<=4;k++)for(int i=0;i+(1<<k)<=4;i++){int x=t[k-1][i],y=t[k-1][i+(1<<(k-1))];t[k][i]=x<y?x:y;}int l=1,r=3,k=1,x=t[k][l],y=t[k][r-(1<<k)+1];printf("%d\\n",x<y?x:y);',
    },
  },
  {
    name: "Matrix",
    tag: "Linear",
    description: "Two-dimensional indexed storage for grids and dynamic programming.",
    access: "O(1)",
    search: "O(rows × cols)",
    insert: "O(1) update",
    remove: "O(1) clear",
    space: "O(rows × cols)",
    notes:
      "Indexing/updating an existing cell is constant. Adding a row/column or resizing dense storage is a different operation.",
    samples: {
      JavaScript:
        "const grid=[[3,1],[4,2]];grid[1][0]=9;console.log(grid.map(r=>r.join(' ')).join('\\n'));",
      Python: "grid=[[3,1],[4,2]];grid[1][0]=9\nfor row in grid:print(*row)",
      Java: "int[][]g={{3,1},{4,2}};g[1][0]=9;for(int[]row:g)System.out.println(Arrays.toString(row));",
      C: 'int g[2][2]={{3,1},{4,2}};g[1][0]=9;for(int r=0;r<2;r++){for(int c=0;c<2;c++)printf("%d ",g[r][c]);printf("\\n");}',
    },
  },
];
