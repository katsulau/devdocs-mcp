interface Matcher {

    compare(a: string, b: string): number; // 0: equal, <0: a<b, >0: a>b

}

class ExactMatcher implements Matcher {

    compare(a: string, b: string): number {

        return a === b ? 0 : a.localeCompare(b);

    }

}

class PartialMatcher implements Matcher {

    compare(a: string, b: string): number {

        if (a.includes(b) && b.includes(a)) return 0;

        return a.localeCompare(b);

    }

}